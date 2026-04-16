import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.db.models import Expert, ReviewAssignment, ExpertReview
from src.services.kafka_service import kafka_service
from src.core.config import settings
import logging

logger = logging.getLogger(__name__)

class ReviewService:
    async def assign_experts_to_idea(self, db: AsyncSession, idea_id: str, category: str):
        # 1. Find experts for this category
        result = await db.execute(select(Expert).where(Expert.specialty == category))
        experts = result.scalars().all()

        if not experts:
            logger.warning(f"No experts found for category: {category}")
            return

        # 2. Assign up to 3 experts
        for expert in experts[:3]:
            assignment = ReviewAssignment(
                idea_id=uuid.UUID(idea_id),
                expert_id=expert.id,
                status="PENDING"
            )
            db.add(assignment)
        
        await db.commit()
        logger.info(f"Assigned {len(experts[:3])} experts to idea {idea_id}")

    async def submit_review(self, db: AsyncSession, expert_id: str, assignment_id: uuid.UUID, score: float, comment: str = None):
        # 1. Verify assignment
        result = await db.execute(
            select(ReviewAssignment)
            .where(ReviewAssignment.id == assignment_id)
            .where(ReviewAssignment.expert_id == expert_id)
        )
        assignment = result.scalar_one_or_none()
        
        if not assignment:
            raise Exception("Assignment not found or unauthorized")
        
        if assignment.status != "PENDING":
            raise Exception("Assignment already completed")

        # 2. Create review
        review = ExpertReview(
            assignment_id=assignment_id,
            score=score,
            comment=comment
        )
        db.add(review)

        # 3. Update assignment
        assignment.status = "COMPLETED"
        
        await db.commit()

        # 4. Check if all assignments for this idea are completed
        # and calculate average score
        await self._check_and_finalize_idea(db, assignment.idea_id)

        return review

    async def _check_and_finalize_idea(self, db: AsyncSession, idea_id: uuid.UUID):
        # Count pending assignments
        pending_result = await db.execute(
            select(ReviewAssignment)
            .where(ReviewAssignment.idea_id == idea_id)
            .where(ReviewAssignment.status == "PENDING")
        )
        pending_count = len(pending_result.scalars().all())

        if pending_count == 0:
            # All reviews done!
            reviews_result = await db.execute(
                select(ExpertReview)
                .join(ReviewAssignment)
                .where(ReviewAssignment.idea_id == idea_id)
            )
            reviews = reviews_result.scalars().all()
            
            if reviews:
                avg_score = sum(r.score for r in reviews) / len(reviews)
                
                # Emit IDEA_REVIEWED event
                await kafka_service.send_event(
                    settings.KAFKA_REVIEWS_TOPIC,
                    "IDEA_REVIEWED",
                    {
                        "idea_id": str(idea_id),
                        "average_score": avg_score,
                        "review_count": len(reviews)
                    }
                )

review_service = ReviewService()
