package com.chintan.expertreview.controller;

import com.chintan.expertreview.model.IdeaReview;
import com.chintan.expertreview.model.ReviewAction;
import com.chintan.expertreview.repository.IdeaReviewRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/expert-review")
public class ExpertReviewController {

    private final IdeaReviewRepository repository;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public ExpertReviewController(IdeaReviewRepository repository, KafkaTemplate<String, String> kafkaTemplate, ObjectMapper objectMapper) {
        this.repository = repository;
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
    }

    @PostMapping("/reviews")
    public IdeaReview submitReview(
            @RequestBody IdeaReview review,
            @RequestHeader("X-User-Id") String userId
    ) {
        if (repository.existsByIdeaIdAndExpertId(review.getIdeaId(), userId)) {
            throw new RuntimeException("Review already submitted by this expert");
        }
        review.setExpertId(userId);
        IdeaReview saved = repository.save(review);

        // Emit Kafka Event
        try {
            Map<String, Object> event = new HashMap<>();
            event.put("type", "REVIEW_COMPLETED");
            Map<String, Object> data = new HashMap<>();
            data.put("idea_id", review.getIdeaId());
            data.put("expert_id", userId);
            data.put("action", review.getAction().name());
            data.put("notes", review.getNotes());
            event.put("data", data);

            kafkaTemplate.send("expert-events", objectMapper.writeValueAsString(event));
        } catch (Exception e) {
            // Log error but don't fail the request
            e.printStackTrace();
        }

        return saved;
    }

    @GetMapping("/reviews/{ideaId}")
    public List<IdeaReview> getReviewsForIdea(@PathVariable String ideaId) {
        return repository.findByIdeaId(ideaId);
    }
}
