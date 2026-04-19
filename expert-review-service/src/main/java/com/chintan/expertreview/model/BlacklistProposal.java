package com.chintan.expertreview.model;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;
@Entity
@Data
@Table(name = "blacklist_proposals")
public class BlacklistProposal {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    private String targetUserId;
    private String reason;
    private String proposedBy;
    @Enumerated(EnumType.STRING) private BlacklistStatus status = BlacklistStatus.PENDING;
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime expiresAt = LocalDateTime.now().plusHours(72);
    private int upvotes = 0;
    private int downvotes = 0;
}
