from pydantic import BaseModel, Field

class ReportRequest(BaseModel):
    reason: str = Field(..., max_length=500)

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from src.db.session import get_db
from src.schemas.idea import IdeaCreate, IdeaResponse
from src.services.idea_service import idea_service
from src.db.models import Idea
from sqlalchemy import select
from uuid import UUID

router = APIRouter(prefix="/ideas", tags=["Ideas"])

@router.post("", response_model=IdeaResponse, status_code=201)
async def create_idea(
    idea_in: IdeaCreate,
    x_user_id: str = Header(..., alias="X-User-Id"),
    x_user_name: str = Header(..., alias="X-User-Name"),
    db: AsyncSession = Depends(get_db)
):
    return await idea_service.create_idea(db, idea_in, x_user_id, x_user_name)

@router.get("/{id}", response_model=IdeaResponse)
async def get_idea(id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Idea).where(Idea.id == id))
    idea = result.scalar_one_or_none()
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    return idea

@router.get("/trending/hero", response_model=IdeaResponse)
async def get_trending_hero(db: AsyncSession = Depends(get_db)):
    # Simple trending logic: highest vote count from the last 7 days
    from datetime import datetime, timedelta
    seven_days_ago = datetime.now() - timedelta(days=7)
    
    query = (
        select(Idea)
        .where(Idea.created_at >= seven_days_ago)
        .order_by(Idea.vote_count.desc())
        .limit(1)
    )
    
    result = await db.execute(query)
    idea = result.scalar_one_or_none()
    
    if not idea:
        # Fallback to all-time top if nothing in last 7 days
        query = select(Idea).order_by(Idea.vote_count.desc()).limit(1)
        result = await db.execute(query)
        idea = result.scalar_one_or_none()
        
    if not idea:
        raise HTTPException(status_code=404, detail="No trending ideas found")
    return idea
