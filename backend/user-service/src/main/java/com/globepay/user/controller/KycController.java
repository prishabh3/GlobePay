package com.globepay.user.controller;

import com.globepay.shared.response.ApiResponse;
import com.globepay.user.dto.KycDocumentRequest;
import com.globepay.user.dto.KycDocumentResponse;
import com.globepay.user.dto.KycStatusResponse;
import com.globepay.user.service.KycService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/kyc")
@RequiredArgsConstructor
@Tag(name = "KYC", description = "Know Your Customer verification")
public class KycController {

    private final KycService kycService;

    @PostMapping("/documents")
    @Operation(summary = "Upload a KYC document")
    public ResponseEntity<ApiResponse<KycDocumentResponse>> uploadDocument(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody KycDocumentRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                kycService.uploadDocument(userId, request), "Document uploaded successfully"));
    }

    @GetMapping("/status")
    @Operation(summary = "Get KYC verification status")
    public ResponseEntity<ApiResponse<KycStatusResponse>> getKycStatus(
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(ApiResponse.success(kycService.getKycStatus(userId)));
    }

    @GetMapping("/documents")
    @Operation(summary = "List all KYC documents")
    public ResponseEntity<ApiResponse<List<KycDocumentResponse>>> getDocuments(
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(ApiResponse.success(kycService.getDocuments(userId)));
    }
}
