import httpx
import logging
from src.core.config import settings

logger = logging.getLogger(__name__)

class ModerationClient:
    def __init__(self):
        self.url = f"{settings.MODERATION_SERVICE_URL}/api/v1/moderation/check"

    async def check_content(self, content: str | list[str]) -> dict:
        """
        Calls the moderation-service.
        Returns a dict with 'is_flagged' and 'score'.
        Implements a simple fail-open strategy.
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.url,
                    json={"content": content},
                    timeout=2.0 # 2 second timeout
                )
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"Moderation service returned {response.status_code}")
                    return {"is_flagged": False, "error": True, "status": "ERROR"}
        except Exception as e:
            logger.error(f"Failed to connect to moderation service: {e}")
            return {"is_flagged": False, "error": True, "status": "DOWN"}

moderation_client = ModerationClient()
