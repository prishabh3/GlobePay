package com.globepay.bank.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class LoanRequest {
    @NotBlank private String userId;
    @NotNull @DecimalMin("1000") private BigDecimal amount;
    @NotBlank private String currency;
    @NotBlank private String purpose;
    private Integer termMonths;
}
