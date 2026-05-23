package com.globepay.card.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class IssueCardRequest {

    @NotBlank
    private String cardholderName;

    private String currency = "USD";

    @DecimalMin(value = "0")
    private BigDecimal spendingLimit;
}
