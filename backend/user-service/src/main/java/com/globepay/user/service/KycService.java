package com.globepay.user.service;

import com.globepay.shared.event.KYCApprovedEvent;
import com.globepay.shared.exception.BusinessException;
import com.globepay.shared.exception.ResourceNotFoundException;
import com.globepay.user.dto.AdminKycReviewRequest;
import com.globepay.user.dto.KycDocumentRequest;
import com.globepay.user.dto.KycDocumentResponse;
import com.globepay.user.dto.KycStatusResponse;
import com.globepay.user.entity.*;
import com.globepay.user.kafka.KycEventPublisher;
import com.globepay.user.repository.KycDocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class KycService {

    private final KycDocumentRepository kycDocumentRepository;
    private final UserProfileService userProfileService;
    private final KycEventPublisher kycEventPublisher;

    @Transactional
    public KycDocumentResponse uploadDocument(String userId, KycDocumentRequest request) {
        // Replace existing document of the same type
        kycDocumentRepository.findByUserIdAndDocumentType(userId, request.getDocumentType())
                .ifPresent(existing -> kycDocumentRepository.delete(existing));

        KycDocument doc = KycDocument.builder()
                .userId(userId)
                .documentType(request.getDocumentType())
                .documentNumber(request.getDocumentNumber())
                .documentUrl(request.getDocumentUrl())
                .expiryDate(request.getExpiryDate())
                .status(DocumentStatus.PENDING)
                .build();

        doc = kycDocumentRepository.save(doc);

        // Move overall KYC status to IN_REVIEW if not already approved
        userProfileService.updateKycStatus(userId, KycStatus.IN_REVIEW);

        log.info("KYC document uploaded for userId={} type={}", userId, request.getDocumentType());
        return toResponse(doc);
    }

    @Transactional(readOnly = true)
    public KycStatusResponse getKycStatus(String userId) {
        List<KycDocument> documents = kycDocumentRepository.findByUserId(userId);
        List<KycDocumentResponse> docResponses = documents.stream().map(this::toResponse).toList();

        // Derive overall status from profile
        var profile = userProfileService.getProfile(userId);

        String message = switch (profile.getKycStatus()) {
            case PENDING -> "Please upload your documents to begin KYC verification.";
            case IN_REVIEW -> "Your documents are under review. We will notify you shortly.";
            case APPROVED -> "Your KYC has been approved. You have full access.";
            case REJECTED -> "Your KYC has been rejected. Please re-upload your documents.";
        };

        return KycStatusResponse.builder()
                .userId(userId)
                .overallStatus(profile.getKycStatus())
                .documents(docResponses)
                .message(message)
                .build();
    }

    @Transactional(readOnly = true)
    public List<KycDocumentResponse> getDocuments(String userId) {
        return kycDocumentRepository.findByUserId(userId).stream().map(this::toResponse).toList();
    }

    @Transactional
    public void reviewKyc(String userId, String reviewerEmail, AdminKycReviewRequest request) {
        List<KycDocument> documents = kycDocumentRepository.findByUserId(userId);
        if (documents.isEmpty()) {
            throw new BusinessException("No KYC documents found for user: " + userId, 400);
        }

        DocumentStatus newDocStatus = request.getApproved() ? DocumentStatus.APPROVED : DocumentStatus.REJECTED;
        KycStatus newKycStatus = request.getApproved() ? KycStatus.APPROVED : KycStatus.REJECTED;

        documents.forEach(doc -> {
            doc.setStatus(newDocStatus);
            doc.setReviewedBy(reviewerEmail);
            doc.setReviewedAt(LocalDateTime.now());
            if (!request.getApproved()) {
                doc.setRejectionReason(request.getNotes());
            }
        });
        kycDocumentRepository.saveAll(documents);

        userProfileService.updateKycStatus(userId, newKycStatus);

        if (request.getApproved()) {
            kycEventPublisher.publishKycApproved(KYCApprovedEvent.builder()
                    .userId(userId)
                    .approvedBy(reviewerEmail)
                    .approvedAt(LocalDateTime.now())
                    .notes(request.getNotes())
                    .build());
        }

        log.info("KYC reviewed for userId={} approved={} by={}", userId, request.getApproved(), reviewerEmail);
    }

    @Transactional(readOnly = true)
    public KycDocumentResponse getDocument(UUID documentId) {
        return kycDocumentRepository.findById(documentId)
                .map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found: " + documentId));
    }

    private KycDocumentResponse toResponse(KycDocument d) {
        return KycDocumentResponse.builder()
                .id(d.getId())
                .userId(d.getUserId())
                .documentType(d.getDocumentType())
                .documentNumber(d.getDocumentNumber())
                .documentUrl(d.getDocumentUrl())
                .expiryDate(d.getExpiryDate())
                .status(d.getStatus())
                .reviewedBy(d.getReviewedBy())
                .reviewedAt(d.getReviewedAt())
                .rejectionReason(d.getRejectionReason())
                .createdAt(d.getCreatedAt())
                .build();
    }
}
