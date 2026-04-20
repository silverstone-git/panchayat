package com.chintan.expertreview.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "idea_reviews")
public class IdeaReview {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String ideaId;
    private String expertId;
    private String category;

    @Enumerated(EnumType.STRING)
    private ReviewAction action; // ENDORSE, FLAG

    @Column(columnDefinition = "TEXT")
    private String notes;

    private LocalDateTime createdAt = LocalDateTime.now();

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getIdeaId() { return ideaId; }
    public void setIdeaId(String ideaId) { this.ideaId = ideaId; }
    public String getExpertId() { return expertId; }
    public void setExpertId(String expertId) { this.expertId = expertId; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public ReviewAction getAction() { return action; }
    public void setAction(ReviewAction action) { this.action = action; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
