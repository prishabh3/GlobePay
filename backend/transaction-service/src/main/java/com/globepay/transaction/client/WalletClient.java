package com.globepay.transaction.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@Component
@Slf4j
public class WalletClient {

    private final WebClient webClient;

    public WalletClient(@Value("${wallet.service.url}") String walletServiceUrl) {
        this.webClient = WebClient.builder().baseUrl(walletServiceUrl).build();
    }

    public void debit(UUID walletId, String currency, BigDecimal amount) {
        try {
            webClient.post()
                    .uri("/api/v1/wallets/internal/debit")
                    .bodyValue(Map.of("walletId", walletId, "currency", currency, "amount", amount))
                    .retrieve()
                    .bodyToMono(Void.class)
                    .block();
        } catch (WebClientResponseException e) {
            log.error("Debit failed for walletId={}: {} {}", walletId, e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("Debit failed: " + e.getResponseBodyAsString(), e);
        }
    }

    public void credit(UUID walletId, String currency, BigDecimal amount) {
        try {
            webClient.post()
                    .uri("/api/v1/wallets/internal/credit")
                    .bodyValue(Map.of("walletId", walletId, "currency", currency, "amount", amount))
                    .retrieve()
                    .bodyToMono(Void.class)
                    .block();
        } catch (WebClientResponseException e) {
            log.error("Credit failed for walletId={}: {} {}", walletId, e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("Credit failed: " + e.getResponseBodyAsString(), e);
        }
    }
}
