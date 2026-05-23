package com.globepay.bank.controller;

import com.globepay.bank.dto.*;
import com.globepay.bank.service.BankIntegrationService;
import com.globepay.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/bank")
@RequiredArgsConstructor
@Tag(name = "Bank Integration", description = "External bank API integration with circuit breakers")
public class BankIntegrationController {

    private final BankIntegrationService bankIntegrationService;

    @PostMapping("/verify-account")
    @Operation(summary = "Verify an external bank account")
    public ResponseEntity<ApiResponse<AccountVerificationResponse>> verifyAccount(
            @Valid @RequestBody AccountVerificationRequest request) {
        return ResponseEntity.ok(ApiResponse.success(bankIntegrationService.verifyAccount(request)));
    }

    @PostMapping("/loan/apply")
    @Operation(summary = "Apply for a loan (simulated bank approval)")
    public ResponseEntity<ApiResponse<LoanResponse>> applyForLoan(
            @Valid @RequestBody LoanRequest request) {
        return ResponseEntity.ok(ApiResponse.success(bankIntegrationService.approveLoan(request)));
    }
}
