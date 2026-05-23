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
public class NotificationEvent {
    private String userId;
    private String type; // EMAIL, SMS, PUSH
    private String subject;
    private String message;
    private LocalDateTime createdAt;
}
