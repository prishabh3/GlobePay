package com.globepay.card.dto;

import com.globepay.card.entity.CardStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class CardResponse {
    private UUID id;
    private String userId;
    private String maskedNumber;
    private String cardholderName;
    private LocalDate expiryDate;
    private String cardType;
    private String currency;
    private CardStatus status;
    private BigDecimal spendingLimit;
    private LocalDateTime createdAt;
}
