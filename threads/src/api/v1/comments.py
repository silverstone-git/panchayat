from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from src.db.session import get_db
from src.schemas.comment import CommentCreate, CommentResponse
from src.services.comment_service import comment_service
from uuid import UUID
from typing import List

router = APIRouter(prefix="/ideas", tags=["Comments"])

@router.post("/{idea_id}/comments", response_model=CommentResponse, status_code=201)
async def create_comment(
    idea_id: UUID,
    comment_in: CommentCreate,
    x_user_id: str = Header(..., alias="X-User-Id"),
    db: AsyncSession = Depends(get_db)
):
    return await comment_service.create_comment(db, idea_id, comment_in, x_user_id)

@router.get("/{idea_id}/comments", response_model=List[CommentResponse])
async def get_comments(
    idea_id: UUID,
    sort: str = Query("new", regex="^(top|new)$"),
    db: AsyncSession = Depends(get_db)
):
    return await comment_service.get_comments_for_idea(db, idea_id, sort)
