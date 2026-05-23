package com.globepay.transaction.controller;

import com.globepay.shared.response.ApiResponse;
import com.globepay.shared.response.PagedResponse;
import com.globepay.transaction.dto.TransactionResponse;
import com.globepay.transaction.dto.TransferRequest;
import com.globepay.transaction.service.TransactionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/transactions")
@RequiredArgsConstructor
@Tag(name = "Transactions", description = "Transfer and transaction history")
public class TransactionController {

    private final TransactionService transactionService;

    @PostMapping("/transfer")
    @Operation(summary = "Initiate a wallet-to-wallet transfer")
    public ResponseEntity<ApiResponse<TransactionResponse>> transfer(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody TransferRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                transactionService.transfer(userId, request), "Transfer initiated"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get transaction by ID")
    public ResponseEntity<ApiResponse<TransactionResponse>> getTransaction(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(transactionService.getTransaction(id)));
    }

    @GetMapping("/history")
    @Operation(summary = "Get paginated transaction history for current user")
    public ResponseEntity<ApiResponse<PagedResponse<TransactionResponse>>> getHistory(
            @RequestHeader("X-User-Id") String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.success(transactionService.getHistory(userId, pageable)));
    }

    @PostMapping("/{id}/refund")
    @Operation(summary = "Refund a completed transaction")
    public ResponseEntity<ApiResponse<TransactionResponse>> refund(
            @PathVariable UUID id,
            @RequestHeader("X-User-Id") String requestedBy) {
        return ResponseEntity.ok(ApiResponse.success(
                transactionService.refund(id, requestedBy), "Refund processed"));
    }
}
