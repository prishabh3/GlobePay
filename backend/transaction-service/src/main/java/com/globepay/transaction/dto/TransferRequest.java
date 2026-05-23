package com.globepay.transaction.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class TransferRequest {

    @NotBlank(message = "Idempotency key is required")
    private String idempotencyKey;

    @NotNull(message = "Source wallet ID is required")
    private UUID fromWalletId;

    @NotNull(message = "Destination wallet ID is required")
    private UUID toWalletId;

    @NotBlank(message = "Recipient user ID is required")
    private String toUserId;

    @NotNull
    @DecimalMin(value = "0.01", message = "Amount must be positive")
    private BigDecimal amount;

    @NotBlank
    private String currency;

    private String description;
}
