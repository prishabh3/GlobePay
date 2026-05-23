package com.globepay.card.kafka;

import com.globepay.shared.event.CardIssuedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class CardEventPublisher {

    private static final String CARD_ISSUED_TOPIC = "card-issued";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishCardIssued(CardIssuedEvent event) {
        kafkaTemplate.send(CARD_ISSUED_TOPIC, event.getUserId(), event)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to publish CardIssuedEvent for userId={}", event.getUserId(), ex);
                    } else {
                        log.info("Published CardIssuedEvent for userId={}", event.getUserId());
                    }
                });
    }
}
