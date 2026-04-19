package com.chintan.expertreview.service;
import com.chintan.expertreview.model.*;
import com.chintan.expertreview.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BlacklistService {
    private final BlacklistProposalRepository proposalRepository;
    private final ExpertVoteRepository voteRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final StringRedisTemplate redisTemplate;
    private static final int QUORUM_THRESHOLD = 3;

    public BlacklistProposal proposeBlacklist(String targetUserId, String reason, String proposedBy) {
        BlacklistProposal proposal = new BlacklistProposal();
        proposal.setTargetUserId(targetUserId);
        proposal.setReason(reason);
        proposal.setProposedBy(proposedBy);
        return proposalRepository.save(proposal);
    }

    @Transactional
    public BlacklistProposal castVote(UUID proposalId, String expertId, boolean approved) {
        BlacklistProposal proposal = proposalRepository.findById(proposalId).orElseThrow();
        if (proposal.getStatus() != BlacklistStatus.PENDING) throw new RuntimeException("Closed");
        if (voteRepository.existsByProposalIdAndExpertId(proposalId, expertId)) throw new RuntimeException("Already voted");
        
        ExpertVote vote = new ExpertVote();
        vote.setProposalId(proposalId);
        vote.setExpertId(expertId);
        vote.setApproved(approved);
        
        if (approved) proposal.setUpvotes(proposal.getUpvotes() + 1);
        else proposal.setDownvotes(proposal.getDownvotes() + 1);

        if (proposal.getUpvotes() >= QUORUM_THRESHOLD) {
            proposal.setStatus(BlacklistStatus.APPROVED);
            redisTemplate.opsForValue().set("blacklist:" + proposal.getTargetUserId(), "true");
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                String jsonEvent = mapper.writeValueAsString(Map.of("type", "USER_BLACKLISTED", "data", Map.of("user_id", proposal.getTargetUserId())));
                kafkaTemplate.send("moderation-events", jsonEvent);
            } catch (Exception e) {
                throw new RuntimeException("Failed to serialize Kafka event", e);
            }
        } else if (proposal.getDownvotes() >= QUORUM_THRESHOLD) {
            proposal.setStatus(BlacklistStatus.REJECTED);
        }
        
        return proposalRepository.save(proposal);
    }
}
