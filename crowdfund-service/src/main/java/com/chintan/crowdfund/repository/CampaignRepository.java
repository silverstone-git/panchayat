package com.chintan.crowdfund.repository;

import com.chintan.crowdfund.model.Campaign;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CampaignRepository extends JpaRepository<Campaign, Long> {
    List<Campaign> findByStatus(String status);
    List<Campaign> findByIsFeaturedTrueAndStatus(String status);
}
