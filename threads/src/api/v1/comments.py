from pydantic import BaseModel, Field

class ReportRequest(BaseModel):
    reason: str = Field(..., max_length=500)

from src.services.kafka_service import kafka_service
from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from src.db.session import get_db
from src.schemas.comment import CommentCreate, CommentResponse, PaginatedCommentResponse
from src.services.comment_service import comment_service
from uuid import UUID

router = APIRouter(prefix="/ideas", tags=["Comments"])

@router.post("/{idea_id}/comments", response_model=CommentResponse, status_code=201)
async def create_comment(
    idea_id: UUID,
    comment_in: CommentCreate,
    x_user_id: str = Header(..., alias="X-User-Id"),
    db: AsyncSession = Depends(get_db)
):
    return await comment_service.create_comment(db, idea_id, comment_in, x_user_id)

@router.get("/{idea_id}/comments", response_model=PaginatedCommentResponse)
async def get_comments(
    idea_id: UUID,
    parent_id: UUID | None = Query(None, description="Fetch replies for a specific comment"),
    sort: str = Query("new", pattern="^(top|new)$"),
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db)
):
    return await comment_service.get_comments_for_idea_paginated(db, idea_id, parent_id, sort, page, size)

@router.post("/{comment_id}/report", status_code=202)
async def report_comment(
    comment_id: UUID,
    report_in: ReportRequest,
    x_user_id: str = Header(..., alias="X-User-Id")
):
    await kafka_service.report_content(user_id=x_user_id, target_type="comment", target_id=str(comment_id), reason=report_in.reason)
    return {"message": "Report submitted successfully."}
