from fastapi import APIRouter
from src.schemas.moderation import ModerationRequest, ModerationResult
from src.services.moderation_service import moderation_service

router = APIRouter()

@router.post("/check", response_model=ModerationResult)
async def check_content(request: ModerationRequest):
    return moderation_service.moderate_content(request.content)
