package com.globepay.card.controller;

import com.globepay.card.dto.CardResponse;
import com.globepay.card.dto.IssueCardRequest;
import com.globepay.card.service.CardService;
import com.globepay.shared.response.ApiResponse;
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
@RequestMapping("/api/v1/cards")
@RequiredArgsConstructor
@Tag(name = "Cards", description = "Virtual card management")
public class CardController {

    private final CardService cardService;

    @PostMapping
    @Operation(summary = "Issue a new virtual card")
    public ResponseEntity<ApiResponse<CardResponse>> issueCard(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody IssueCardRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(cardService.issueCard(userId, request), "Card issued successfully"));
    }

    @GetMapping
    @Operation(summary = "List all cards for current user")
    public ResponseEntity<ApiResponse<List<CardResponse>>> getCards(
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(ApiResponse.success(cardService.getCards(userId)));
    }

    @GetMapping("/{cardId}")
    @Operation(summary = "Get card details")
    public ResponseEntity<ApiResponse<CardResponse>> getCard(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable UUID cardId) {
        return ResponseEntity.ok(ApiResponse.success(cardService.getCard(userId, cardId)));
    }

    @PostMapping("/{cardId}/freeze")
    @Operation(summary = "Freeze a card")
    public ResponseEntity<ApiResponse<CardResponse>> freezeCard(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable UUID cardId) {
        return ResponseEntity.ok(ApiResponse.success(cardService.freezeCard(userId, cardId), "Card frozen"));
    }

    @PostMapping("/{cardId}/unfreeze")
    @Operation(summary = "Unfreeze a card")
    public ResponseEntity<ApiResponse<CardResponse>> unfreezeCard(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable UUID cardId) {
        return ResponseEntity.ok(ApiResponse.success(cardService.unfreezeCard(userId, cardId), "Card unfrozen"));
    }

    @DeleteMapping("/{cardId}")
    @Operation(summary = "Cancel a card")
    public ResponseEntity<ApiResponse<Void>> cancelCard(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable UUID cardId) {
        cardService.cancelCard(userId, cardId);
        return ResponseEntity.ok(ApiResponse.success("Card cancelled successfully"));
    }
}
