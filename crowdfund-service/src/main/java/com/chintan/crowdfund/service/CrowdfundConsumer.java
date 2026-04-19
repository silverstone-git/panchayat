package com.chintan.crowdfund.service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import java.util.Map;

@Service
public class CrowdfundConsumer {
    private static final Logger log = LoggerFactory.getLogger(CrowdfundConsumer.class);

    @KafkaListener(topics = "ideas-events", groupId = "crowdfund-group")
    public void handleFundraising(String eventString) {
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            Map<String, Object> event = mapper.readValue(eventString, new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>(){});
            if ("IDEA_POPULAR".equals(event.get("type"))) {
                 log.info("💰 STARTING CROWDFUNDING CAMPAIGN for idea: {}", event.get("data"));
            }
        } catch (Exception e) {
            log.error("Error parsing message: ", e);
        }
    }
}
