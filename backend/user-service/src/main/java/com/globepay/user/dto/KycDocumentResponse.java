package com.globepay.user.dto;

import com.globepay.user.entity.DocumentStatus;
import com.globepay.user.entity.DocumentType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class KycDocumentResponse {
    private UUID id;
    private String userId;
    private DocumentType documentType;
    private String documentNumber;
    private String documentUrl;
    private LocalDate expiryDate;
    private DocumentStatus status;
    private String reviewedBy;
    private LocalDateTime reviewedAt;
    private String rejectionReason;
    private LocalDateTime createdAt;
}
