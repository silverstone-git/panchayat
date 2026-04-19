package com.chintan.govsubmit.service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import java.util.Map;

@Service
public class GovSubmitConsumer {
    private static final Logger log = LoggerFactory.getLogger(GovSubmitConsumer.class);

    @KafkaListener(topics = "ideas-events", groupId = "gov-submit-group")
    public void handlePopularIdea(String eventString) {
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            Map<String, Object> event = mapper.readValue(eventString, new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>(){});
            if ("IDEA_POPULAR".equals(event.get("type"))) {
                log.info("🏛️ SUBMITTING TO GOVERNMENT PORTAL: {}", event.get("data"));
                // Mock API call to gov portal
            }
        } catch (Exception e) {
            log.error("Error parsing message: ", e);
        }
    }
}
