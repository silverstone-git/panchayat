package com.chintan.expertreview.model;
import jakarta.persistence.*;
import lombok.Data;
import java.util.UUID;
@Entity
@Data
@Table(name = "expert_votes", uniqueConstraints = { @UniqueConstraint(columnNames = {"proposalId", "expertId"}) })
public class ExpertVote {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    private UUID proposalId;
    private String expertId;
    private boolean approved;
}
