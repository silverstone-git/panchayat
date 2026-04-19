from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
import uuid
from src.db.models import Comment, Idea
from src.schemas.comment import CommentCreate
from src.services.kafka_service import kafka_service
from src.services.moderation_client import moderation_client
from src.core.config import settings
from fastapi import HTTPException

class CommentService:
    async def create_comment(self, db: AsyncSession, idea_id: UUID, comment_in: CommentCreate, author_id: str):
        # 0. Moderation check
        mod_result = await moderation_client.check_content(comment_in.content)
        if mod_result.get("is_flagged"):
            raise HTTPException(status_code=400, detail="Comment contains prohibited material.")

        status = "APPROVED"
        if mod_result.get("error"):
            status = "PENDING_MODERATION"

        # 1. Verify idea exists
        idea_result = await db.execute(select(Idea).where(Idea.id == idea_id))
        idea = idea_result.scalar_one_or_none()
        if not idea:
            raise HTTPException(status_code=404, detail="Idea not found")

        # 2. Setup initial values
        new_comment_id = uuid.uuid4()
        parent_id = comment_in.parent_id
        depth = 0
        path = str(new_comment_id)

        # 3. If it's a reply, inherit from parent
        if parent_id:
            parent_result = await db.execute(select(Comment).where(Comment.id == parent_id))
            parent = parent_result.scalar_one_or_none()
            if not parent:
                raise HTTPException(status_code=404, detail="Parent comment not found")
            
            if parent.idea_id != idea_id:
                raise HTTPException(status_code=400, detail="Parent comment does not belong to this idea")

            depth = parent.depth + 1
            path = f"{parent.path}/{new_comment_id}"

        # 4. Create the comment
        new_comment = Comment(
            id=new_comment_id,
            idea_id=idea_id,
            parent_id=parent_id,
            path=path,
            depth=depth,
            author_id=author_id,
            content=comment_in.content,
            status=status
        )
        
        db.add(new_comment)
        await db.commit()
        await db.refresh(new_comment)

        # Emit XP event
        xp_amount = 20 if not parent_id else 10
        reason = "COMMENT_CREATED" if not parent_id else "COMMENT_REPLY"
        
        await kafka_service.send_event(
            settings.KAFKA_XP_TOPIC,
            "XP_EARNED",
            {
                "user_id": int(author_id),
                "amount": xp_amount,
                "reason": reason
            }
        )

        return new_comment

    async def get_comments_for_idea_paginated(self, db: AsyncSession, idea_id: UUID, parent_id: UUID | None = None, sort: str = "new", page: int = 1, size: int = 10):
        from sqlalchemy import func, desc, asc
        
        # Determine sorting column and direction
        sort_col = desc(Comment.vote_count) if sort == "top" else desc(Comment.created_at)
        
        # Base query for the comments at this level
        query = (
            select(Comment)
            .where(Comment.idea_id == idea_id)
            .where(Comment.status.in_(["APPROVED", "PENDING_MODERATION"]))
            .where(Comment.parent_id == parent_id)
        )
        
        # Get total count at this level
        total_result = await db.execute(select(func.count()).select_from(query.subquery()))
        total = total_result.scalar_one()
        
        # Fetch paginated items
        paginated_query = query.order_by(sort_col).offset((page - 1) * size).limit(size)
        items_result = await db.execute(paginated_query)
        items = items_result.scalars().all()
        
        # For each item, fetch its reply count
        response_items = []
        for item in items:
            reply_count_result = await db.execute(
                select(func.count(Comment.id))
                .where(Comment.parent_id == item.id)
                .where(Comment.status.in_(["APPROVED", "PENDING_MODERATION"]))
            )
            reply_count = reply_count_result.scalar_one()
            
            # Create a dict representation and append the reply_count
            item_dict = {
                "id": item.id,
                "idea_id": item.idea_id,
                "parent_id": item.parent_id,
                "path": item.path,
                "depth": item.depth,
                "vote_count": item.vote_count,
                "author_id": item.author_id,
                "content": item.content,
                "status": item.status,
                "created_at": item.created_at,
                "reply_count": reply_count
            }
            response_items.append(item_dict)
            
        return {
            "items": response_items,
            "total": total,
            "page": page,
            "size": size,
            "has_more": (page * size) < total
        }

    async def update_vote_count(self, db: AsyncSession, comment_id: UUID, new_count: int):
        from sqlalchemy import update
        stmt = (
            update(Comment)
            .where(Comment.id == comment_id)
            .values(vote_count=new_count)
        )
        await db.execute(stmt)
        await db.commit()


    async def hide_comment(self, db: AsyncSession, comment_id: UUID):
        from sqlalchemy import update
        stmt = (
            update(Comment)
            .where(Comment.id == comment_id)
            .values(status="HIDDEN_BY_COMMUNITY")
        )
        await db.execute(stmt)
        await db.commit()

comment_service = CommentService()

