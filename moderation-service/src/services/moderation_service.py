from profanity_check import predict, predict_prob
from src.schemas.moderation import ModerationResult

class ModerationService:
    def moderate_content(self, content: str | list[str]) -> ModerationResult:
        if isinstance(content, str):
            texts = [content]
        else:
            texts = content

        predictions = predict(texts)
        probabilities = predict_prob(texts)

        # Flagged if any prediction is 1
        is_flagged = any(predictions == 1)
        # Max probability as the score
        score = float(max(probabilities))

        return ModerationResult(
            is_flagged=is_flagged,
            score=score
        )

moderation_service = ModerationService()
