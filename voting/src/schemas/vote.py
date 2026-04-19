from pydantic import BaseModel, Field

class VoteRequest(BaseModel):
    direction: int = Field(..., description="1 for Upvote, -1 for Downvote, 0 to Clear")

class VoteResponse(BaseModel):
    target_id: str
    total_votes: float
    user_vote: int
