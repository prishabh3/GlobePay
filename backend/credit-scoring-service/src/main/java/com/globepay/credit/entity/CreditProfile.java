package com.globepay.credit.entity;

import com.globepay.shared.entity.AuditEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "credit_profiles", indexes = {
        @Index(name = "idx_credit_user_id", columnList = "user_id", unique = true)
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreditProfile extends AuditEntity {

    @Id
    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "credit_score", nullable = false)
    private Integer creditScore;

    @Column(name = "credit_limit", precision = 19, scale = 2)
    private BigDecimal creditLimit;

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level", nullable = false)
    private RiskLevel riskLevel;

    @Enumerated(EnumType.STRING)
    @Column(name = "employment_status")
    private EmploymentStatus employmentStatus;

    @Column(name = "annual_income", precision = 19, scale = 2)
    private BigDecimal annualIncome;

    @Column(name = "education_level", length = 100)
    private String educationLevel;

    @Column(name = "visa_type", length = 50)
    private String visaType;

    @Column(name = "university", length = 200)
    private String university;

    @Column(name = "score_breakdown", length = 1000)
    private String scoreBreakdown;
}
