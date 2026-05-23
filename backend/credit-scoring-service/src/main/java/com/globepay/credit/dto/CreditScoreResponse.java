package com.globepay.credit.dto;

import com.globepay.credit.entity.RiskLevel;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class CreditScoreResponse {
    private String userId;
    private Integer creditScore;
    private BigDecimal creditLimit;
    private RiskLevel riskLevel;
    private String scoreBreakdown;
    private LocalDateTime assessedAt;
}
