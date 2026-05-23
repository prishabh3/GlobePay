package com.globepay.user.kafka;

import com.globepay.shared.event.KYCApprovedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class KycEventPublisher {

    private static final String KYC_APPROVED_TOPIC = "kyc-approved";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishKycApproved(KYCApprovedEvent event) {
        kafkaTemplate.send(KYC_APPROVED_TOPIC, event.getUserId(), event)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to publish KYCApprovedEvent for userId={}", event.getUserId(), ex);
                    } else {
                        log.info("Published KYCApprovedEvent for userId={}", event.getUserId());
                    }
                });
    }
}
