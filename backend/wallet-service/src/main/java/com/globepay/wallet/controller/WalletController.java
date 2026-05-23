package com.globepay.wallet.controller;

import com.globepay.shared.response.ApiResponse;
import com.globepay.wallet.dto.*;
import com.globepay.wallet.entity.Currency;
import com.globepay.wallet.service.WalletService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/wallets")
@RequiredArgsConstructor
@Tag(name = "Wallets", description = "Multi-currency wallet management")
public class WalletController {

    private final WalletService walletService;

    @PostMapping
    @Operation(summary = "Create a new wallet for a currency")
    public ResponseEntity<ApiResponse<WalletResponse>> createWallet(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody CreateWalletRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(walletService.createWallet(userId, request), "Wallet created"));
    }

    @GetMapping
    @Operation(summary = "List all wallets for the current user")
    public ResponseEntity<ApiResponse<List<WalletResponse>>> getWallets(
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(ApiResponse.success(walletService.getWallets(userId)));
    }

    @GetMapping("/{currency}")
    @Operation(summary = "Get wallet by currency")
    public ResponseEntity<ApiResponse<WalletResponse>> getWallet(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable Currency currency) {
        return ResponseEntity.ok(ApiResponse.success(walletService.getWallet(userId, currency)));
    }

    @GetMapping("/id/{walletId}")
    @Operation(summary = "Get wallet by ID (internal / admin use)")
    public ResponseEntity<ApiResponse<WalletResponse>> getWalletById(@PathVariable UUID walletId) {
        return ResponseEntity.ok(ApiResponse.success(walletService.getWalletById(walletId)));
    }

    @PostMapping("/convert")
    @Operation(summary = "Convert between currency wallets")
    public ResponseEntity<ApiResponse<ConvertResponse>> convert(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody ConvertRequest request) {
        return ResponseEntity.ok(ApiResponse.success(walletService.convert(userId, request), "Conversion successful"));
    }

    @PostMapping("/internal/debit")
    @Operation(summary = "Internal: debit a wallet (called by transaction-service)")
    public ResponseEntity<ApiResponse<WalletResponse>> debit(@Valid @RequestBody WalletOperationRequest request) {
        return ResponseEntity.ok(ApiResponse.success(walletService.debit(request.getWalletId(), request.getAmount())));
    }

    @PostMapping("/internal/credit")
    @Operation(summary = "Internal: credit a wallet (called by transaction-service)")
    public ResponseEntity<ApiResponse<WalletResponse>> credit(@Valid @RequestBody WalletOperationRequest request) {
        return ResponseEntity.ok(ApiResponse.success(walletService.credit(request.getWalletId(), request.getAmount())));
    }
}
