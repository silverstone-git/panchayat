from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.db.session import get_db
from src.db.models import ReviewAssignment, ExpertReview, Expert
from src.services.review_service import review_service
from src.core.config import settings
import uuid

router = APIRouter()

@router.get("/assignments")
async def get_assignments(
    x_user_id: str = Header(..., alias=settings.USER_ID_HEADER),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(ReviewAssignment)
        .where(ReviewAssignment.expert_id == x_user_id)
        .where(ReviewAssignment.status == "PENDING")
    )
    return result.scalars().all()

@router.post("/submit/{assignment_id}")
async def submit_review(
    assignment_id: uuid.UUID,
    score: float,
    comment: str = None,
    x_user_id: str = Header(..., alias=settings.USER_ID_HEADER),
    db: AsyncSession = Depends(get_db)
):
    try:
        review = await review_service.submit_review(db, x_user_id, assignment_id, score, comment)
        return review
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/experts/register")
async def register_expert(
    specialty: str,
    name: str,
    bio: str = None,
    x_user_id: str = Header(..., alias=settings.USER_ID_HEADER),
    db: AsyncSession = Depends(get_db)
):
    expert = Expert(
        id=x_user_id,
        name=name,
        specialty=specialty,
        bio=bio
    )
    db.add(expert)
    await db.commit()
    return expert
