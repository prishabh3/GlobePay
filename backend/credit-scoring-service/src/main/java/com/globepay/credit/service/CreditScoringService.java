package com.globepay.credit.service;

import com.globepay.credit.dto.CreditAssessmentRequest;
import com.globepay.credit.dto.CreditScoreResponse;
import com.globepay.credit.entity.CreditProfile;
import com.globepay.credit.entity.EmploymentStatus;
import com.globepay.credit.entity.RiskLevel;
import com.globepay.credit.repository.CreditProfileRepository;
import com.globepay.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.StringJoiner;

@Service
@RequiredArgsConstructor
@Slf4j
public class CreditScoringService {

    private final CreditProfileRepository creditProfileRepository;

    @Transactional
    public CreditScoreResponse assess(String userId, CreditAssessmentRequest request) {
        int score = calculateScore(request);
        RiskLevel risk = deriveRisk(score);
        BigDecimal limit = deriveLimit(score, request.getAnnualIncome());
        String breakdown = buildBreakdown(request, score);

        CreditProfile profile = creditProfileRepository.findById(userId)
                .orElse(CreditProfile.builder().userId(userId).build());

        profile.setCreditScore(score);
        profile.setCreditLimit(limit);
        profile.setRiskLevel(risk);
        profile.setEmploymentStatus(request.getEmploymentStatus());
        profile.setAnnualIncome(request.getAnnualIncome());
        profile.setEducationLevel(request.getEducationLevel());
        profile.setVisaType(request.getVisaType());
        profile.setUniversity(request.getUniversity());
        profile.setScoreBreakdown(breakdown);
        creditProfileRepository.save(profile);

        log.info("Credit assessed for userId={} score={} risk={}", userId, score, risk);
        return buildResponse(profile);
    }

    @Transactional(readOnly = true)
    public CreditScoreResponse getScore(String userId) {
        CreditProfile profile = creditProfileRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Credit profile not found for userId: " + userId));
        return buildResponse(profile);
    }

    private int calculateScore(CreditAssessmentRequest req) {
        int score = 300;

        // Employment (max +200)
        score += switch (req.getEmploymentStatus()) {
            case EMPLOYED -> 200;
            case SELF_EMPLOYED -> 150;
            case STUDENT -> 100;
            case RETIRED -> 120;
            case UNEMPLOYED -> 30;
        };

        // Income (max +200)
        double income = req.getAnnualIncome().doubleValue();
        if (income >= 100_000) score += 200;
        else if (income >= 50_000) score += 150;
        else if (income >= 25_000) score += 100;
        else if (income >= 10_000) score += 60;
        else score += 20;

        // Education (max +150)
        if (req.getEducationLevel() != null) {
            String edu = req.getEducationLevel().toLowerCase();
            if (edu.contains("phd") || edu.contains("doctorate")) score += 150;
            else if (edu.contains("master")) score += 120;
            else if (edu.contains("bachelor")) score += 90;
            else if (edu.contains("diploma")) score += 60;
            else score += 30;
        }

        // Visa type (max +100)
        if (req.getVisaType() != null) {
            String visa = req.getVisaType().toLowerCase();
            if (visa.contains("permanent") || visa.contains("citizen")) score += 100;
            else if (visa.contains("work") || visa.contains("h1b") || visa.contains("h-1b")) score += 80;
            else if (visa.contains("student") || visa.contains("f-1")) score += 50;
            else score += 30;
        }

        // University prestige (max +50)
        if (req.getUniversity() != null && !req.getUniversity().isBlank()) {
            score += 50;
        }

        return Math.min(score, 900);
    }

    private RiskLevel deriveRisk(int score) {
        if (score >= 750) return RiskLevel.LOW;
        if (score >= 600) return RiskLevel.MEDIUM;
        if (score >= 450) return RiskLevel.HIGH;
        return RiskLevel.VERY_HIGH;
    }

    private BigDecimal deriveLimit(int score, BigDecimal annualIncome) {
        double multiplier = switch (deriveRisk(score)) {
            case LOW -> 0.5;
            case MEDIUM -> 0.3;
            case HIGH -> 0.15;
            case VERY_HIGH -> 0.05;
        };
        return annualIncome.multiply(BigDecimal.valueOf(multiplier)).setScale(2, java.math.RoundingMode.HALF_UP);
    }

    private String buildBreakdown(CreditAssessmentRequest req, int totalScore) {
        StringJoiner sj = new StringJoiner("; ");
        sj.add("Employment=" + req.getEmploymentStatus());
        sj.add("Income=" + req.getAnnualIncome());
        if (req.getEducationLevel() != null) sj.add("Education=" + req.getEducationLevel());
        if (req.getVisaType() != null) sj.add("Visa=" + req.getVisaType());
        sj.add("TotalScore=" + totalScore);
        return sj.toString();
    }

    private CreditScoreResponse buildResponse(CreditProfile p) {
        return CreditScoreResponse.builder()
                .userId(p.getUserId())
                .creditScore(p.getCreditScore())
                .creditLimit(p.getCreditLimit())
                .riskLevel(p.getRiskLevel())
                .scoreBreakdown(p.getScoreBreakdown())
                .assessedAt(p.getUpdatedAt() != null ? p.getUpdatedAt() : LocalDateTime.now())
                .build();
    }
}
