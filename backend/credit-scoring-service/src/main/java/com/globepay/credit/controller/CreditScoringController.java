package com.globepay.credit.controller;

import com.globepay.credit.dto.CreditAssessmentRequest;
import com.globepay.credit.dto.CreditScoreResponse;
import com.globepay.credit.service.CreditScoringService;
import com.globepay.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/credit")
@RequiredArgsConstructor
@Tag(name = "Credit Scoring", description = "Alternative credit assessment and scoring")
public class CreditScoringController {

    private final CreditScoringService creditScoringService;

    @PostMapping("/assess")
    @Operation(summary = "Submit profile for credit assessment")
    public ResponseEntity<ApiResponse<CreditScoreResponse>> assess(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody CreditAssessmentRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                creditScoringService.assess(userId, request), "Credit assessment completed"));
    }

    @GetMapping("/score")
    @Operation(summary = "Get current credit score")
    public ResponseEntity<ApiResponse<CreditScoreResponse>> getScore(
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(ApiResponse.success(creditScoringService.getScore(userId)));
    }

    @GetMapping("/score/{userId}")
    @Operation(summary = "Get credit score by user ID (admin)")
    public ResponseEntity<ApiResponse<CreditScoreResponse>> getScoreByAdmin(@PathVariable String userId) {
        return ResponseEntity.ok(ApiResponse.success(creditScoringService.getScore(userId)));
    }
}
