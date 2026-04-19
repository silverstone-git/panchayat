package com.chintan.notification.service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import java.util.Map;

@Service
public class NotificationConsumer {
    private static final Logger log = LoggerFactory.getLogger(NotificationConsumer.class);

    @KafkaListener(topics = {"ideas-events", "votes-events", "moderation-events"}, groupId = "notification-group")
    public void handleEvent(String eventString) {
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            Map<String, Object> event = mapper.readValue(eventString, new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>(){});
            log.info("🔔 NOTIFICATION RECEIVED: {}", event);
            // Logic to send email/push would go here
        } catch (Exception e) {
            log.error("Error parsing message: ", e);
        }
    }
}
