from pydantic import BaseModel

class ModerationRequest(BaseModel):
    content: str | list[str]

class ModerationResult(BaseModel):
    is_flagged: bool
    score: float
    flagged_terms: list[str] = []
