package com.globepay.credit.kafka;

import com.globepay.credit.dto.CreditAssessmentRequest;
import com.globepay.credit.entity.EmploymentStatus;
import com.globepay.credit.service.CreditScoringService;
import com.globepay.shared.event.KYCApprovedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
@Slf4j
public class CreditEventConsumer {

    private final CreditScoringService creditScoringService;

    @KafkaListener(topics = "kyc-approved", groupId = "credit-scoring-service")
    public void onKycApproved(KYCApprovedEvent event) {
        log.info("KYC approved for userId={} — initialising credit profile", event.getUserId());
        try {
            CreditAssessmentRequest defaultRequest = new CreditAssessmentRequest();
            defaultRequest.setEmploymentStatus(EmploymentStatus.EMPLOYED);
            defaultRequest.setAnnualIncome(new BigDecimal("30000"));
            creditScoringService.assess(event.getUserId(), defaultRequest);
        } catch (Exception e) {
            log.error("Failed to init credit profile for userId={}", event.getUserId(), e);
        }
    }
}
