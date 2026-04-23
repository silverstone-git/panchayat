from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional, List

class ImageAttachment(BaseModel):
    url: str
    key: Optional[str] = None
    hash: Optional[str] = None
    caption: Optional[str] = None

class IdeaCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=255)
    description: str = Field(..., min_length=10)
    category: str = Field(...)
    images: Optional[List[ImageAttachment]] = None

class IdeaResponse(BaseModel):
    id: UUID
    title: str
    description: str
    category: str
    author_id: str
    author_name: Optional[str] = None
    vote_count: int
    upvote_count: int
    downvote_count: int
    comment_count: int = 0
    status: str
    created_at: datetime
    images: Optional[List[ImageAttachment]] = []

    model_config = ConfigDict(from_attributes=True)

class FeedResponse(BaseModel):
    items: List[IdeaResponse]
    total: int
    page: int
    size: int
    has_more: bool
