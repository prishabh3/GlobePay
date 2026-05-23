package com.globepay.user.controller;

import com.globepay.shared.response.ApiResponse;
import com.globepay.shared.response.PagedResponse;
import com.globepay.user.dto.AdminKycReviewRequest;
import com.globepay.user.dto.UserProfileResponse;
import com.globepay.user.entity.KycStatus;
import com.globepay.user.service.KycService;
import com.globepay.user.service.UserProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/kyc")
@RequiredArgsConstructor
@Tag(name = "Admin KYC", description = "Admin KYC management operations")
public class AdminKycController {

    private final KycService kycService;
    private final UserProfileService userProfileService;

    @GetMapping("/pending")
    @Operation(summary = "List users with pending/in-review KYC")
    public ResponseEntity<ApiResponse<PagedResponse<UserProfileResponse>>> getPendingKyc(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<UserProfileResponse> result = userProfileService.getUsersByKycStatus(KycStatus.IN_REVIEW, pageable);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.of(result)));
    }

    @GetMapping("/users")
    @Operation(summary = "List all users (admin)")
    public ResponseEntity<ApiResponse<PagedResponse<UserProfileResponse>>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<UserProfileResponse> result = userProfileService.getAllUsers(pageable);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.of(result)));
    }

    @PutMapping("/{userId}/review")
    @Operation(summary = "Approve or reject a user's KYC")
    public ResponseEntity<ApiResponse<Void>> reviewKyc(
            @PathVariable String userId,
            @RequestHeader("X-User-Email") String reviewerEmail,
            @Valid @RequestBody AdminKycReviewRequest request) {
        kycService.reviewKyc(userId, reviewerEmail, request);
        String msg = request.getApproved() ? "KYC approved successfully" : "KYC rejected";
        return ResponseEntity.ok(ApiResponse.success(msg));
    }
}
