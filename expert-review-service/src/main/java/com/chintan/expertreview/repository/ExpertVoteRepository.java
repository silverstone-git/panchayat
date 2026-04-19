package com.chintan.expertreview.repository;
import com.chintan.expertreview.model.ExpertVote;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
public interface ExpertVoteRepository extends JpaRepository<ExpertVote, UUID> {
    boolean existsByProposalIdAndExpertId(UUID proposalId, String expertId);
}
