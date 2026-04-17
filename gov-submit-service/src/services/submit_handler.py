import logging
from src.core.config import settings

logger = logging.getLogger(__name__)

async def handle_review_event(event: dict, topic: str):
    event_type = event.get("type")
    data = event.get("data")

    if event_type == "IDEA_REVIEWED":
        avg_score = data.get("average_score")
        idea_id = data.get("idea_id")
        
        if avg_score >= settings.MIN_EXPERT_SCORE:
            logger.info(f"IDEA {idea_id} PASSED EXPERT REVIEW WITH SCORE {avg_score}. SUBMITTING TO GOV PORTAL...")
            # Simulate submission
            await simulate_gov_submission(idea_id, data)
        else:
            logger.info(f"Idea {idea_id} did not meet the expert score threshold ({avg_score} < {settings.MIN_EXPERT_SCORE})")

async def simulate_gov_submission(idea_id: str, data: dict):
    # In a real app, this would call an external API
    logger.info(f"SUCCESSFULLY SUBMITTED IDEA {idea_id} TO NATIONAL CIVIC PORTAL. REFERENCE: GOV-{uuid_short()}")

def uuid_short():
    import uuid
    return str(uuid.uuid4())[:8]
