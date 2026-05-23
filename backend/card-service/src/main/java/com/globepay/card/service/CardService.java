package com.globepay.card.service;

import com.globepay.card.dto.CardResponse;
import com.globepay.card.dto.IssueCardRequest;
import com.globepay.card.entity.Card;
import com.globepay.card.entity.CardStatus;
import com.globepay.card.kafka.CardEventPublisher;
import com.globepay.card.repository.CardRepository;
import com.globepay.shared.event.CardIssuedEvent;
import com.globepay.shared.exception.BusinessException;
import com.globepay.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CardService {

    private final CardRepository cardRepository;
    private final CardEventPublisher cardEventPublisher;
    private static final SecureRandom RANDOM = new SecureRandom();

    @Transactional
    public CardResponse issueCard(String userId, IssueCardRequest request) {
        String rawNumber = generateCardNumber();
        String masked = maskCardNumber(rawNumber);
        String cvv = String.format("%03d", RANDOM.nextInt(1000));
        LocalDate expiry = LocalDate.now().plusYears(3);

        Card card = Card.builder()
                .userId(userId)
                .cardNumber(rawNumber)
                .maskedNumber(masked)
                .cardholderName(request.getCardholderName().toUpperCase())
                .expiryDate(expiry)
                .cvv(cvv)
                .cardType("VIRTUAL")
                .currency(request.getCurrency() != null ? request.getCurrency() : "USD")
                .status(CardStatus.ACTIVE)
                .spendingLimit(request.getSpendingLimit())
                .build();

        card = cardRepository.save(card);
        log.info("Virtual card issued for userId={} cardId={}", userId, card.getId());

        cardEventPublisher.publishCardIssued(CardIssuedEvent.builder()
                .userId(userId)
                .cardId(card.getId().toString())
                .last4Digits(rawNumber.substring(rawNumber.length() - 4))
                .cardType("VIRTUAL")
                .issuedAt(LocalDateTime.now())
                .build());

        return toResponse(card);
    }

    @Transactional(readOnly = true)
    public List<CardResponse> getCards(String userId) {
        return cardRepository.findByUserId(userId).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public CardResponse getCard(String userId, UUID cardId) {
        return cardRepository.findByIdAndUserId(cardId, userId)
                .map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found: " + cardId));
    }

    @Transactional
    public CardResponse freezeCard(String userId, UUID cardId) {
        Card card = getCardEntity(userId, cardId);
        if (card.getStatus() == CardStatus.CANCELLED) {
            throw new BusinessException("Cannot freeze a cancelled card", 422);
        }
        card.setStatus(CardStatus.FROZEN);
        return toResponse(cardRepository.save(card));
    }

    @Transactional
    public CardResponse unfreezeCard(String userId, UUID cardId) {
        Card card = getCardEntity(userId, cardId);
        if (card.getStatus() == CardStatus.CANCELLED) {
            throw new BusinessException("Cannot unfreeze a cancelled card", 422);
        }
        card.setStatus(CardStatus.ACTIVE);
        return toResponse(cardRepository.save(card));
    }

    @Transactional
    public void cancelCard(String userId, UUID cardId) {
        Card card = getCardEntity(userId, cardId);
        card.setStatus(CardStatus.CANCELLED);
        cardRepository.save(card);
        log.info("Card cancelled cardId={} userId={}", cardId, userId);
    }

    private Card getCardEntity(String userId, UUID cardId) {
        return cardRepository.findByIdAndUserId(cardId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found: " + cardId));
    }

    private String generateCardNumber() {
        StringBuilder sb = new StringBuilder("4");
        for (int i = 0; i < 15; i++) sb.append(RANDOM.nextInt(10));
        return sb.toString();
    }

    private String maskCardNumber(String number) {
        return "**** **** **** " + number.substring(number.length() - 4);
    }

    private CardResponse toResponse(Card c) {
        return CardResponse.builder()
                .id(c.getId())
                .userId(c.getUserId())
                .maskedNumber(c.getMaskedNumber())
                .cardholderName(c.getCardholderName())
                .expiryDate(c.getExpiryDate())
                .cardType(c.getCardType())
                .currency(c.getCurrency())
                .status(c.getStatus())
                .spendingLimit(c.getSpendingLimit())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
