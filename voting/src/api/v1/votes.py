from fastapi import APIRouter, Header, HTTPException, Query
from src.schemas.vote import VoteRequest, VoteResponse
from src.services.vote_service import vote_service
from typing import List

router = APIRouter(prefix="/votes", tags=["Votes"])

@router.post("/{target_type}/{target_id}", response_model=VoteResponse)
async def cast_vote(
    target_type: str,
    target_id: str,
    vote_in: VoteRequest,
    x_user_id: str = Header(..., alias="X-User-Id")
):
    if target_type not in ["idea", "comment"]:
        raise HTTPException(status_code=400, detail="Invalid target type")

    new_total = await vote_service.cast_vote(
        target_type=target_type,
        target_id=target_id,
        user_id=x_user_id,
        direction=vote_in.direction
    )

    return VoteResponse(
        target_id=target_id,
        total_votes=new_total,
        user_vote=vote_in.direction
    )

@router.get("/my-votes")
async def get_my_votes(
    target_type: str = Query("idea", description="Type of target (idea or comment)"),
    target_ids: str = Query(..., description="Comma-separated target IDs"),
    x_user_id: str = Header(..., alias="X-User-Id")
):
    ids_list = [t.strip() for t in target_ids.split(",") if t.strip()]
    if not ids_list:
        return {}

    return await vote_service.get_user_votes(target_type, ids_list, x_user_id)
