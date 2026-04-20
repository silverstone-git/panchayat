package com.chintan.expertreview.repository;

import com.chintan.expertreview.model.IdeaReview;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface IdeaReviewRepository extends JpaRepository<IdeaReview, Long> {
    List<IdeaReview> findByIdeaId(String ideaId);
    boolean existsByIdeaIdAndExpertId(String ideaId, String expertId);
}
