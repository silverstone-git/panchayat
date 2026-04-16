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
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
