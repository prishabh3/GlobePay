package com.globepay.credit.service;

import com.globepay.credit.dto.CreditAssessmentRequest;
import com.globepay.credit.dto.CreditScoreResponse;
import com.globepay.credit.entity.CreditProfile;
import com.globepay.credit.entity.EmploymentStatus;
import com.globepay.credit.entity.RiskLevel;
import com.globepay.credit.repository.CreditProfileRepository;
import com.globepay.shared.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CreditScoringServiceTest {

    @Mock CreditProfileRepository creditProfileRepository;

    @InjectMocks CreditScoringService creditScoringService;

    private static final String USER_ID = "user-abc";

    // -----------------------------------------------------------------------
    // assess — score boundaries and risk derivation
    // -----------------------------------------------------------------------

    @Test
    void assess_highIncomeEmployed_lowRiskScore() {
        when(creditProfileRepository.findById(USER_ID)).thenReturn(Optional.empty());
        when(creditProfileRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        CreditAssessmentRequest req = request(EmploymentStatus.EMPLOYED, 120_000, "PhD", "permanent resident", "MIT");
        CreditScoreResponse res = creditScoringService.assess(USER_ID, req);

        // base(300) + employment(200) + income(200) + phd(150) + permanent(100) + university(50) = 1000, capped at 900
        assertThat(res.getCreditScore()).isEqualTo(900);
        assertThat(res.getRiskLevel()).isEqualTo(RiskLevel.LOW);
    }

    @Test
    void assess_unemployedLowIncome_veryHighRisk() {
        when(creditProfileRepository.findById(USER_ID)).thenReturn(Optional.empty());
        when(creditProfileRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        CreditAssessmentRequest req = request(EmploymentStatus.UNEMPLOYED, 5_000, null, null, null);
        CreditScoreResponse res = creditScoringService.assess(USER_ID, req);

        // base(300) + unemployed(30) + income<10k(20) = 350 → VERY_HIGH
        assertThat(res.getCreditScore()).isEqualTo(350);
        assertThat(res.getRiskLevel()).isEqualTo(RiskLevel.VERY_HIGH);
    }

    @Test
    void assess_studentMidIncome_highRisk() {
        when(creditProfileRepository.findById(USER_ID)).thenReturn(Optional.empty());
        when(creditProfileRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        // base(300) + student(100) + income25k(100) + bachelor(90) + student visa(50) = 640 → MEDIUM
        CreditAssessmentRequest req = request(EmploymentStatus.STUDENT, 25_000, "bachelor", "student f-1", null);
        CreditScoreResponse res = creditScoringService.assess(USER_ID, req);

        assertThat(res.getCreditScore()).isEqualTo(640);
        assertThat(res.getRiskLevel()).isEqualTo(RiskLevel.MEDIUM);
    }

    @Test
    void assess_scoreExactly750_lowRiskBoundary() {
        when(creditProfileRepository.findById(USER_ID)).thenReturn(Optional.empty());
        when(creditProfileRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        // base(300) + employed(200) + income50k(150) + bachelor(90) + no visa + no uni = 740 → MEDIUM
        // Add H1B visa (+80) = 820 → LOW
        CreditAssessmentRequest req = request(EmploymentStatus.EMPLOYED, 50_000, "bachelor", "H1B work", null);
        CreditScoreResponse res = creditScoringService.assess(USER_ID, req);

        assertThat(res.getCreditScore()).isEqualTo(820);
        assertThat(res.getRiskLevel()).isEqualTo(RiskLevel.LOW);
    }

    // -----------------------------------------------------------------------
    // assess — credit limit derivation
    // -----------------------------------------------------------------------

    @Test
    void assess_creditLimit_lowRisk_halfOfIncome() {
        when(creditProfileRepository.findById(USER_ID)).thenReturn(Optional.empty());
        when(creditProfileRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        CreditAssessmentRequest req = request(EmploymentStatus.EMPLOYED, 100_000, "PhD", "permanent resident", "MIT");
        CreditScoreResponse res = creditScoringService.assess(USER_ID, req);

        // LOW risk: limit = income * 0.5
        assertThat(res.getCreditLimit()).isEqualByComparingTo("50000.00");
    }

    @Test
    void assess_creditLimit_veryHighRisk_fivePercentOfIncome() {
        when(creditProfileRepository.findById(USER_ID)).thenReturn(Optional.empty());
        when(creditProfileRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        CreditAssessmentRequest req = request(EmploymentStatus.UNEMPLOYED, 20_000, null, null, null);
        CreditScoreResponse res = creditScoringService.assess(USER_ID, req);

        // VERY_HIGH risk: limit = income * 0.05
        assertThat(res.getCreditLimit()).isEqualByComparingTo("1000.00");
    }

    // -----------------------------------------------------------------------
    // assess — existing profile is updated
    // -----------------------------------------------------------------------

    @Test
    void assess_existingProfile_isUpdatedNotCreated() {
        CreditProfile existing = CreditProfile.builder().userId(USER_ID).creditScore(400).build();
        when(creditProfileRepository.findById(USER_ID)).thenReturn(Optional.of(existing));
        when(creditProfileRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        CreditAssessmentRequest req = request(EmploymentStatus.EMPLOYED, 100_000, "PhD", "permanent", "MIT");
        creditScoringService.assess(USER_ID, req);

        // save called once (update), not twice
        verify(creditProfileRepository, times(1)).save(existing);
    }

    // -----------------------------------------------------------------------
    // getScore
    // -----------------------------------------------------------------------

    @Test
    void getScore_existingProfile_returnsData() {
        CreditProfile profile = CreditProfile.builder()
                .userId(USER_ID)
                .creditScore(700)
                .riskLevel(RiskLevel.MEDIUM)
                .creditLimit(new BigDecimal("15000.00"))
                .build();
        when(creditProfileRepository.findById(USER_ID)).thenReturn(Optional.of(profile));

        CreditScoreResponse res = creditScoringService.getScore(USER_ID);

        assertThat(res.getCreditScore()).isEqualTo(700);
        assertThat(res.getRiskLevel()).isEqualTo(RiskLevel.MEDIUM);
    }

    @Test
    void getScore_noProfile_throwsNotFound() {
        when(creditProfileRepository.findById(USER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> creditScoringService.getScore(USER_ID))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // -----------------------------------------------------------------------
    // Helper
    // -----------------------------------------------------------------------

    private CreditAssessmentRequest request(EmploymentStatus status, double income,
                                             String education, String visa, String university) {
        CreditAssessmentRequest req = new CreditAssessmentRequest();
        req.setEmploymentStatus(status);
        req.setAnnualIncome(BigDecimal.valueOf(income));
        req.setEducationLevel(education);
        req.setVisaType(visa);
        req.setUniversity(university);
        return req;
    }
}
