package com.globepay.credit.dto;

import com.globepay.credit.entity.EmploymentStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreditAssessmentRequest {

    @NotNull
    private EmploymentStatus employmentStatus;

    @NotNull
    @DecimalMin("0")
    private BigDecimal annualIncome;

    private String educationLevel;
    private String visaType;
    private String university;
}
