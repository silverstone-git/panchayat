package com.chintan.expertreview.repository;
import com.chintan.expertreview.model.BlacklistProposal;
import com.chintan.expertreview.model.BlacklistStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;
public interface BlacklistProposalRepository extends JpaRepository<BlacklistProposal, UUID> {
    List<BlacklistProposal> findByStatus(BlacklistStatus status);
}
