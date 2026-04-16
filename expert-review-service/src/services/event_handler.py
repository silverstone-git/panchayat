from src.services.review_service import review_service
from src.db.session import SessionLocal
import logging

logger = logging.getLogger(__name__)

async def handle_event(event: dict):
    event_type = event.get("type")
    data = event.get("data")

    if event_type == "IDEA_CREATED":
        idea_id = data.get("id")
        category = data.get("category")
        
        logger.info(f"Handling IDEA_CREATED for idea {idea_id} in category {category}")
        
        async with SessionLocal() as db:
            await review_service.assign_experts_to_idea(db, idea_id, category)
    else:
        logger.debug(f"Unhandled event type: {event_type}")
