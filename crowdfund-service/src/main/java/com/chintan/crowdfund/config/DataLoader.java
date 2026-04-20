package com.chintan.crowdfund.config;

import com.chintan.crowdfund.model.Campaign;
import com.chintan.crowdfund.repository.CampaignRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;

@Component
public class DataLoader implements CommandLineRunner {

    private final CampaignRepository repository;

    public DataLoader(CampaignRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (repository.count() == 0) {
            Campaign c1 = new Campaign();
            c1.setTitle("Local Park Renovation");
            c1.setDescription("Sector 3 Community Park needs your help to reach the goal. Includes new seating and playground equipment.");
            c1.setCategory("Infrastructure");
            c1.setGoalAmount(new BigDecimal("100000"));
            c1.setRaisedAmount(new BigDecimal("65000"));
            c1.setSupportersCount(124);
            c1.setStatus("ACTIVE");
            c1.setFeatured(true);
            repository.save(c1);

            Campaign c2 = new Campaign();
            c2.setTitle("Digital Literacy for Rural High Schools");
            c2.setDescription("Bridging the urban-rural divide by deploying 50 modern computer labs across the northern districts.");
            c2.setCategory("Education Reform");
            c2.setImageUrl("https://lh3.googleusercontent.com/aida-public/AB6AXuCzR9Wh_PjZysEyW0QXyOESIvuG0b5zpn-lc3l3Dvz9A0B9Ugu1vHuNrAfzmCzNi458S62ZBpAhVBPxncYm4Happz-HA6Z-neGXTLLGcIK6qE28Xi0taDmKYgnsmDUvSRYQ_1i4bb4p8D3q7ZH2qBFPnxGyIDbcYip68hcUbEy2sL2ct0pXl68KIQR8bCdS419nrTuc88DUCqf3qLQ7wPnhEPCiSsH4w2IC-cuKUzSbt4rDB5cvFPOwLVH3gucVppUcziMaeo2bP7I");
            c2.setGoalAmount(new BigDecimal("60000"));
            c2.setRaisedAmount(new BigDecimal("42500"));
            c2.setSupportersCount(892);
            c2.setStatus("ACTIVE");
            c2.setFeatured(false);
            repository.save(c2);

            Campaign c3 = new Campaign();
            c3.setTitle("Clean Water Access");
            c3.setDescription("Filtration units for 12 public schools.");
            c3.setCategory("Infrastructure");
            c3.setGoalAmount(new BigDecimal("15000"));
            c3.setRaisedAmount(new BigDecimal("12000"));
            c3.setSupportersCount(45);
            c3.setStatus("ACTIVE");
            c3.setFeatured(false);
            repository.save(c3);
        }
    }
}
