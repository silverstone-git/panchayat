from pydantic import BaseModel

class ModerationRequest(BaseModel):
    content: str | list[str]

class ModerationResult(BaseModel):
    is_flagged: bool
    score: float
    flagged_terms: list[str] = []

from datetime import datetime
from typing import Optional
from pydantic import ConfigDict

class ReportResponse(BaseModel):
    id: int
    reporter_id: str
    target_type: str
    target_id: str
    reason: str
    status: str
    moderator_id: Optional[str] = None
    moderator_notes: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class ReportAction(BaseModel):
    action: str # HIDE, IGNORE
    notes: Optional[str] = None
