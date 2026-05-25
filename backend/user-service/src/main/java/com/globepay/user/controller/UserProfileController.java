package com.globepay.user.controller;

import com.globepay.shared.response.ApiResponse;
import com.globepay.user.dto.UserProfileRequest;
import com.globepay.user.dto.UserProfileResponse;
import com.globepay.user.service.UserProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "User Profile", description = "User profile management")
public class UserProfileController {

    private final UserProfileService userProfileService;

    @GetMapping("/me")
    @Operation(summary = "Get current user profile")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getMyProfile(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader(value = "X-User-Email", required = false) String email) {
        return ResponseEntity.ok(ApiResponse.success(userProfileService.getOrCreateProfile(userId, email)));
    }

    @PutMapping("/me")
    @Operation(summary = "Update current user profile")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateMyProfile(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody UserProfileRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                userProfileService.updateProfile(userId, request), "Profile updated successfully"));
    }

    @GetMapping("/{userId}")
    @Operation(summary = "Get user profile by ID (admin)")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getUserById(@PathVariable String userId) {
        return ResponseEntity.ok(ApiResponse.success(userProfileService.getProfileByAdmin(userId)));
    }
}
