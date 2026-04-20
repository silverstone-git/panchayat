package com.chintan.crowdfund.controller;

import com.chintan.crowdfund.model.Campaign;
import com.chintan.crowdfund.repository.CampaignRepository;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/crowdfund")
public class CampaignController {
    
    private final CampaignRepository repository;

    public CampaignController(CampaignRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/campaigns")
    public List<Campaign> getAllActive() {
        return repository.findByStatus("ACTIVE");
    }

    @GetMapping("/campaigns/featured")
    public List<Campaign> getFeatured() {
        return repository.findByIsFeaturedTrueAndStatus("ACTIVE");
    }

    @GetMapping("/campaigns/{id}")
    public Campaign getById(@PathVariable Long id) {
        return repository.findById(id).orElseThrow();
    }
}
