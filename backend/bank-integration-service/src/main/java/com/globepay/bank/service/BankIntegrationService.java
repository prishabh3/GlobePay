package com.globepay.bank.service;

import com.globepay.bank.dto.*;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import io.github.resilience4j.timelimiter.annotation.TimeLimiter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Service
@Slf4j
public class BankIntegrationService {

    @CircuitBreaker(name = "externalBank", fallbackMethod = "verifyAccountFallback")
    @Retry(name = "externalBank")
    public AccountVerificationResponse verifyAccount(AccountVerificationRequest request) {
        log.info("Verifying account={} bank={}", request.getAccountNumber(), request.getBankCode());
        // Simulated external bank call
        simulateLatency(200);
        boolean verified = !request.getAccountNumber().startsWith("000");
        return AccountVerificationResponse.builder()
                .verified(verified)
                .accountNumber(request.getAccountNumber())
                .bankCode(request.getBankCode())
                .accountHolderName(request.getAccountHolderName())
                .message(verified ? "Account verified successfully" : "Account not found")
                .build();
    }

    public AccountVerificationResponse verifyAccountFallback(AccountVerificationRequest request, Exception ex) {
        log.warn("Account verification fallback triggered: {}", ex.getMessage());
        return AccountVerificationResponse.builder()
                .verified(false)
                .accountNumber(request.getAccountNumber())
                .bankCode(request.getBankCode())
                .accountHolderName(request.getAccountHolderName())
                .message("Bank verification service temporarily unavailable. Please try again later.")
                .build();
    }

    @CircuitBreaker(name = "externalBank", fallbackMethod = "approveLoanFallback")
    @Retry(name = "externalBank")
    public LoanResponse approveLoan(LoanRequest request) {
        log.info("Processing loan request for userId={} amount={}", request.getUserId(), request.getAmount());
        simulateLatency(500);

        // Simple approval logic: approve if amount <= 50000
        boolean approved = request.getAmount().compareTo(new BigDecimal("50000")) <= 0;
        BigDecimal approvedAmount = approved ? request.getAmount() : BigDecimal.ZERO;
        BigDecimal rate = approved ? new BigDecimal("8.5") : BigDecimal.ZERO;
        int term = request.getTermMonths() != null ? request.getTermMonths() : 12;

        return LoanResponse.builder()
                .referenceId(UUID.randomUUID().toString())
                .approved(approved)
                .approvedAmount(approvedAmount)
                .interestRate(rate)
                .termMonths(term)
                .status(approved ? "APPROVED" : "DECLINED")
                .message(approved ? "Loan approved" : "Amount exceeds maximum limit")
                .build();
    }

    public LoanResponse approveLoanFallback(LoanRequest request, Exception ex) {
        log.warn("Loan approval fallback triggered: {}", ex.getMessage());
        return LoanResponse.builder()
                .referenceId(UUID.randomUUID().toString())
                .approved(false)
                .status("PENDING")
                .message("Loan processing service temporarily unavailable. Request queued.")
                .build();
    }

    private void simulateLatency(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
