from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from profanity_check import predict
from fastapi import HTTPException
from src.db.models import Idea
from src.schemas.idea import IdeaCreate
from src.services.kafka_service import kafka_service
from src.services.search_service import search_service
from src.services.cache_service import cache_service
from src.core.config import settings

class IdeaService:
    @staticmethod
    def _check_profanity(texts: list[str]):
        predictions = predict(texts)
        if any(predictions):
            raise HTTPException(status_code=400, detail="Content contains profanity.")

    async def create_idea(self, db: AsyncSession, idea_in: IdeaCreate, author_id: str):
        # Profanity check
        self._check_profanity([idea_in.title, idea_in.description])

        # Create Idea
        new_idea = Idea(
            title=idea_in.title,
            description=idea_in.description,
            category=idea_in.category,
            author_id=author_id
        )
        db.add(new_idea)
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
                "vote_count": new_idea.vote_count,
                "created_at": new_idea.created_at.isoformat()
            }
        )

        # Send Kafka Event
        await kafka_service.send_event(
            settings.KAFKA_IDEAS_TOPIC,
            "IDEA_CREATED",
            {
                "id": str(new_idea.id),
                "title": new_idea.title,
                "author_id": new_idea.author_id
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

    async def update_vote_count(self, db: AsyncSession, idea_id: str, new_count: int):
        stmt = (
            update(Idea)
            .where(Idea.id == idea_id)
            .values(vote_count=new_count)
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
                    "vote_count": idea.vote_count,
                    "created_at": idea.created_at.isoformat()
                }
            )

            # Invalidate Cache
            await cache_service.clear_feed_cache()

            # Check for Popularity
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

idea_service = IdeaService()
