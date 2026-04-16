from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional, List

class IdeaCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=255)
    description: str = Field(..., min_length=10)
    category: str = Field(...)

class IdeaResponse(BaseModel):
    id: UUID
    title: str
    description: str
    category: str
    author_id: str
    vote_count: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class FeedResponse(BaseModel):
    ideas: List[IdeaResponse]
    total: int
    page: int
    size: int
