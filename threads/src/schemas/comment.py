from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional, List

class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)
    parent_id: Optional[UUID] = None

class CommentResponse(BaseModel):
    id: UUID
    idea_id: UUID
    parent_id: Optional[UUID]
    path: str
    depth: int
    vote_count: int
    author_id: str
    content: str
    status: str
    created_at: datetime
    reply_count: int = 0

    model_config = ConfigDict(from_attributes=True)

class PaginatedCommentResponse(BaseModel):
    items: List[CommentResponse]
    total: int
    page: int
    size: int
    has_more: bool
