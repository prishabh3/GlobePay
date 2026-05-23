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
public class KYCApprovedEvent {
    private String userId;
    private String approvedBy;
    private LocalDateTime approvedAt;
    private String notes;
}
