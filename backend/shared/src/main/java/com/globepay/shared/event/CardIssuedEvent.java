package com.globepay.shared.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CardIssuedEvent {
    private String userId;
    private String cardId;
    private String last4Digits;
    private String cardType;
    private LocalDateTime issuedAt;
}
