import logging

logger = logging.getLogger(__name__)

async def handle_notification(event: dict, topic: str):
    event_type = event.get("type")
    data = event.get("data")

    logger.info(f"Notification triggered for {event_type} on topic {topic}")

    if event_type == "IDEA_CREATED":
        logger.info(f"SEND PUSH: New idea created: {data.get('title')}")
    elif event_type == "IDEA_POPULAR":
        logger.info(f"SEND PUSH/EMAIL: Idea '{data.get('title')}' is now popular with {data.get('vote_count')} votes!")
    elif event_type == "IDEA_REVIEWED":
        logger.info(f"SEND PUSH: Idea {data.get('idea_id')} has been reviewed. Avg Score: {data.get('average_score')}")
    elif event_type == "XP_EARNED":
        logger.info(f"SEND PUSH: You earned {data.get('amount')} XP for {data.get('reason')}")
    else:
        logger.debug(f"No specific notification logic for {event_type}")
