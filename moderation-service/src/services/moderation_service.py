from profanity_check import predict, predict_prob
from src.schemas.moderation import ModerationResult
import re

class ModerationService:
    def __init__(self):
        # Common substitutions: a=@,4; s=$,5; i=1,!,|; o=0; e=3; t=+; b=8
        # This is a basic pattern to catch common bypasses like a$$hole, f*ck, etc.
        self.forbidden_patterns = [
            r"f[u|*|v|4|k|x]+ck",
            r"s[h||*|5]+[i|1|!|l]+t",
            r"a[s|$|5]{2}h[o|0]+[l|1|i]e",
            r"b[i|1|!|l]+tch",
            r"p[u|*]+ssy",
            r"d[i|1|!|l]+ck",
            r"c[u|*]+nt",
            r"f[a|@|4]+g"
        ]
        self.compiled_patterns = [re.compile(p, re.IGNORECASE) for p in self.forbidden_patterns]

    def _check_clever_variations(self, texts: list[str]) -> bool:
        for text in texts:
            # Normalize text: remove common separators that are used to break words
            normalized = re.sub(r"[\.\-\_\s\*\+]", "", text)
            for pattern in self.compiled_patterns:
                if pattern.search(text) or pattern.search(normalized):
                    return True
        return False

    def moderate_content(self, content: str | list[str]) -> ModerationResult:
        if isinstance(content, str):
            texts = [content]
        else:
            texts = content

        # Check regex first
        regex_flagged = self._check_clever_variations(texts)

        predictions = predict(texts)
        probabilities = predict_prob(texts)

        # Use an even more conservative threshold (0.95)
        ml_flagged = any(prob > 0.95 for prob in probabilities)
        
        is_flagged = regex_flagged or ml_flagged
        # Max probability as the score, or 1.0 if regex caught it
        score = 1.0 if regex_flagged else float(max(probabilities))

        return ModerationResult(
            is_flagged=is_flagged,
            score=score
        )

moderation_service = ModerationService()
