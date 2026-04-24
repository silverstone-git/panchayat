from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from fastapi import HTTPException
from src.db.models import Idea, ImageRecord
from src.schemas.idea import IdeaCreate
from src.services.kafka_service import kafka_service
from src.services.search_service import search_service
from src.services.cache_service import cache_service
from src.services.moderation_client import moderation_client
from src.core.config import settings

class IdeaService:
    async def create_idea(self, db: AsyncSession, idea_in: IdeaCreate, author_id: str, author_name: str = None):
        # Moderation check
        mod_result = await moderation_client.check_content([idea_in.title, idea_in.description])
        
        if mod_result.get("is_flagged"):
            raise HTTPException(
                status_code=403, 
                detail="Your proposal has been restricted"
            )

        status = "APPROVED"
        if mod_result.get("error"):
            status = "PENDING_MODERATION" # Fail-open with flag

        # Create Idea
        new_idea = Idea(
            title=idea_in.title,
            description=idea_in.description,
            category=idea_in.category,
            author_id=author_id,
            author_name=author_name,
            images=[img.model_dump() for img in idea_in.images] if idea_in.images else None,
            status=status
        )
        db.add(new_idea)
        await db.flush() # flush to get new_idea.id

        # Register/Link images
        if idea_in.images:
            for img in idea_in.images:
                if img.hash and img.key:
                    # check if exists
                    stmt = select(ImageRecord).where(ImageRecord.file_hash == img.hash).limit(1)
                    res = await db.execute(stmt)
                    existing_image = res.scalar_one_or_none()
                    
                    if not existing_image:
                        # Add a new row
                        new_img_record = ImageRecord(
                            idea_id=new_idea.id,
                            uploaded_user_id=author_id,
                            file_key=img.key,
                            public_url=img.url,
                            file_hash=img.hash
                        )
                        db.add(new_img_record)
                    else:
                        # Hash exists, meaning R2 has it. 
                        # We create a new DB record pointing to the same R2 key if the idea_id differs
                        # Or if we want strict deduplication, we just link it. The user said:
                        # "if the hash collides... just simply a new image row should be added in an images table instead of uploading to R2 yet again"
                        new_img_record = ImageRecord(
                            idea_id=new_idea.id,
                            uploaded_user_id=author_id,
                            file_key=existing_image.file_key,
                            public_url=existing_image.public_url,
                            file_hash=existing_image.file_hash
                        )
                        db.add(new_img_record)

        await db.commit()
        await db.refresh(new_idea)

        # Index in Elasticsearch
        await search_service.index_idea(
            str(new_idea.id),
            {
                "title": new_idea.title,
                "description": new_idea.description,
                "category": new_idea.category,
                "author_id": new_idea.author_id,
                "author_name": new_idea.author_name,
                "vote_count": new_idea.vote_count,
                "upvote_count": new_idea.upvote_count,
                "downvote_count": new_idea.downvote_count,
                "status": new_idea.status,
                "created_at": new_idea.created_at.isoformat(),
                "images": new_idea.images
            }
        )

        # Send Kafka Event
        await kafka_service.send_event(
            settings.KAFKA_IDEAS_TOPIC,
            "IDEA_CREATED",
            {
                "id": str(new_idea.id),
                "title": new_idea.title,
                "author_id": new_idea.author_id,
                "category": new_idea.category
            }
        )

        # Emit XP event
        await kafka_service.send_event(
            settings.KAFKA_XP_TOPIC,
            "XP_EARNED",
            {
                "user_id": int(author_id),
                "amount": 50,
                "reason": "IDEA_CREATED"
            }
        )

        # Invalidate Cache

        await cache_service.clear_feed_cache()

        return new_idea

    async def update_vote_count(self, db: AsyncSession, idea_id: str, new_count: float, ups: int = 0, downs: int = 0):
        stmt = (
            update(Idea)
            .where(Idea.id == idea_id)
            .values(
                vote_count=int(new_count),
                upvote_count=ups,
                downvote_count=downs
            )
            .returning(Idea)
        )
        result = await db.execute(stmt)
        idea = result.scalar_one_or_none()
        await db.commit()

        if idea:
            # Sync with ES
            await search_service.index_idea(
                str(idea.id),
                {
                    "title": idea.title,
                    "description": idea.description,
                    "category": idea.category,
                    "author_id": idea.author_id,
                    "author_name": idea.author_name,
                    "vote_count": idea.vote_count,
                    "upvote_count": idea.upvote_count,
                    "downvote_count": idea.downvote_count,
                    "status": idea.status,
                    "created_at": idea.created_at.isoformat()
                }
            )

            # Invalidate Cache
            await cache_service.clear_feed_cache()

            # Check for Popularity / Review Status
            if idea.vote_count >= 5 and idea.status == "APPROVED":
                # For this prototype, 5 votes trigger Expert Review
                stmt_status = (
                    update(Idea)
                    .where(Idea.id == idea_id)
                    .values(status="EXPERT_REVIEW")
                    .returning(Idea)
                )
                res_status = await db.execute(stmt_status)
                idea = res_status.scalar_one()
                
                # Update ES with new status
                await search_service.index_idea(
                    str(idea.id),
                    {
                        "title": idea.title,
                        "description": idea.description,
                        "category": idea.category,
                        "author_id": idea.author_id,
                        "vote_count": idea.vote_count,
                        "upvote_count": idea.upvote_count,
                        "downvote_count": idea.downvote_count,
                        "status": idea.status,
                        "created_at": idea.created_at.isoformat()
                    }
                )

            if idea.vote_count >= settings.POPULAR_VOTE_THRESHOLD:
                await kafka_service.send_event(
                    settings.KAFKA_IDEAS_TOPIC,
                    "IDEA_POPULAR",
                    {
                        "id": str(idea.id),
                        "title": idea.title,
                        "vote_count": idea.vote_count
                    }
                )


    async def delete_idea(self, db: AsyncSession, idea_id: str, current_user_id: str):
        from src.db.models import Comment
        import boto3
        import httpx
        from botocore.config import Config
        import asyncio
        from sqlalchemy import delete
        import logging
        
        logger = logging.getLogger(__name__)

        # Fetch idea
        stmt = select(Idea).where(Idea.id == idea_id)
        result = await db.execute(stmt)
        idea = result.scalar_one_or_none()

        if not idea:
            raise HTTPException(status_code=404, detail="Idea not found")
            
        if idea.author_id != current_user_id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this idea")

        # 1. Fetch related ImageRecords
        img_stmt = select(ImageRecord).where(ImageRecord.idea_id == idea_id)
        img_res = await db.execute(img_stmt)
        images = img_res.scalars().all()

        # 2. Delete from R2 (in a background thread to not block event loop)
        if images and settings.R2_ACCOUNT_ID:
            def delete_from_r2(keys):
                try:
                    s3 = boto3.client(
                        's3',
                        endpoint_url=f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
                        aws_access_key_id=settings.R2_ACCESS_KEY_ID_PANCHAYAT_PUBLIC,
                        aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY_PANCHAYAT_PUBLIC,
                        config=Config(signature_version='s3v4'),
                        region_name='auto'
                    )
                    objects = [{'Key': key} for key in keys]
                    s3.delete_objects(Bucket=settings.R2_BUCKET_NAME_PUBLIC, Delete={'Objects': objects})
                except Exception as e:
                    logger.error(f"Error deleting from R2: {e}")

            loop = asyncio.get_running_loop()
            keys_to_delete = [img.file_key for img in images]
            await loop.run_in_executor(None, delete_from_r2, keys_to_delete)

        # 3. Delete from DB (cascade should ideally handle it, but we can do it manually just in case)
        await db.execute(delete(ImageRecord).where(ImageRecord.idea_id == idea_id))
        await db.execute(delete(Comment).where(Comment.idea_id == idea_id))
        await db.execute(delete(Idea).where(Idea.id == idea_id))
        await db.commit()

        # 4. Remove from Elasticsearch
        await search_service.delete_idea(idea_id)

        # 5. Clear Cache
        await cache_service.clear_feed_cache()
        
        # 6. Tell voting service to delete votes
        try:
            async with httpx.AsyncClient() as client:
                await client.delete(f"{settings.VOTING_SERVICE_URL}/api/v1/votes/target/idea/{idea_id}")
        except Exception as e:
            logger.error(f"Error notifying voting service of idea deletion: {e}")

        return {"status": "deleted"}

    async def hide_idea(self, db: AsyncSession, idea_id: str):
        stmt = (
            update(Idea)
            .where(Idea.id == idea_id)
            .values(status="HIDDEN_BY_COMMUNITY")
            .returning(Idea)
        )
        result = await db.execute(stmt)
        idea = result.scalar_one_or_none()
        await db.commit()

        if idea:
            # Sync with ES
            await search_service.index_idea(
                str(idea.id),
                {
                    "title": idea.title,
                    "description": idea.description,
                    "category": idea.category,
                    "author_id": idea.author_id,
                    "author_name": idea.author_name,
                    "vote_count": idea.vote_count,
                    "status": idea.status,
                    "created_at": idea.created_at.isoformat()
                }
            )
            # Invalidate Cache
            await cache_service.clear_feed_cache()

idea_service = IdeaService()

