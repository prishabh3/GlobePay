package com.globepay.transaction.service;

import com.globepay.shared.event.MoneyTransferredEvent;
import com.globepay.shared.exception.BusinessException;
import com.globepay.shared.exception.ResourceNotFoundException;
import com.globepay.shared.response.PagedResponse;
import com.globepay.transaction.client.WalletClient;
import com.globepay.transaction.dto.TransactionResponse;
import com.globepay.transaction.dto.TransferRequest;
import com.globepay.transaction.entity.Transaction;
import com.globepay.transaction.entity.TransactionStatus;
import com.globepay.transaction.entity.TransactionType;
import com.globepay.transaction.kafka.TransactionEventPublisher;
import com.globepay.transaction.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class TransactionService {

    private static final String IDEMPOTENCY_KEY_PREFIX = "tx:idempotency:";

    private final TransactionRepository transactionRepository;
    private final WalletClient walletClient;
    private final TransactionEventPublisher eventPublisher;
    private final StringRedisTemplate redisTemplate;

    @Transactional
    public TransactionResponse transfer(String fromUserId, TransferRequest request) {
        // Idempotency: return existing result if key already processed
        String redisKey = IDEMPOTENCY_KEY_PREFIX + request.getIdempotencyKey();
        String existingTxId = redisTemplate.opsForValue().get(redisKey);
        if (existingTxId != null) {
            log.info("Idempotent replay for key={}", request.getIdempotencyKey());
            return transactionRepository.findById(UUID.fromString(existingTxId))
                    .map(this::toResponse)
                    .orElseThrow(() -> new ResourceNotFoundException("Transaction not found"));
        }

        // Check DB idempotency as second guard
        return transactionRepository.findByIdempotencyKey(request.getIdempotencyKey())
                .map(existing -> {
                    log.info("DB idempotency hit for key={}", request.getIdempotencyKey());
                    return toResponse(existing);
                })
                .orElseGet(() -> executeTransfer(fromUserId, request, redisKey));
    }

    private TransactionResponse executeTransfer(String fromUserId, TransferRequest request, String redisKey) {
        Transaction tx = Transaction.builder()
                .idempotencyKey(request.getIdempotencyKey())
                .fromUserId(fromUserId)
                .toUserId(request.getToUserId())
                .fromWalletId(request.getFromWalletId())
                .toWalletId(request.getToWalletId())
                .amount(request.getAmount())
                .currency(request.getCurrency())
                .type(TransactionType.TRANSFER)
                .status(TransactionStatus.PROCESSING)
                .description(request.getDescription())
                .build();

        tx = transactionRepository.save(tx);
        log.info("Transfer initiated txId={} from={} to={} amount={} {}",
                tx.getId(), fromUserId, request.getToUserId(), request.getAmount(), request.getCurrency());

        try {
            walletClient.debit(request.getFromWalletId(), request.getCurrency(), request.getAmount());
            walletClient.credit(request.getToWalletId(), request.getCurrency(), request.getAmount());

            tx.setStatus(TransactionStatus.COMPLETED);
            tx = transactionRepository.save(tx);

            // Cache idempotency key for 24 hours
            redisTemplate.opsForValue().set(redisKey, tx.getId().toString(), 24, TimeUnit.HOURS);

            eventPublisher.publishMoneyTransferred(MoneyTransferredEvent.builder()
                    .transactionId(tx.getId().toString())
                    .fromUserId(fromUserId)
                    .toUserId(request.getToUserId())
                    .amount(request.getAmount())
                    .currency(request.getCurrency())
                    .transferredAt(LocalDateTime.now())
                    .build());

            log.info("Transfer completed txId={}", tx.getId());
        } catch (Exception e) {
            tx.setStatus(TransactionStatus.FAILED);
            tx.setFailureReason(e.getMessage());
            transactionRepository.save(tx);
            log.error("Transfer failed txId={}", tx.getId(), e);
            throw new BusinessException("Transfer failed: " + e.getMessage(), 500);
        }

        return toResponse(tx);
    }

    @Transactional(readOnly = true)
    public TransactionResponse getTransaction(UUID id) {
        return transactionRepository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found: " + id));
    }

    @Transactional(readOnly = true)
    public PagedResponse<TransactionResponse> getHistory(String userId, Pageable pageable) {
        return PagedResponse.of(
                transactionRepository.findByFromUserIdOrToUserId(userId, userId, pageable)
                        .map(this::toResponse));
    }

    @Transactional
    public TransactionResponse refund(UUID transactionId, String requestedBy) {
        Transaction original = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found: " + transactionId));

        if (original.getStatus() != TransactionStatus.COMPLETED) {
            throw new BusinessException("Only completed transactions can be refunded", 422);
        }

        // Reverse the transfer
        walletClient.credit(original.getFromWalletId(), original.getCurrency(), original.getAmount());
        walletClient.debit(original.getToWalletId(), original.getCurrency(), original.getAmount());

        original.setStatus(TransactionStatus.REFUNDED);
        original = transactionRepository.save(original);

        Transaction refundTx = Transaction.builder()
                .idempotencyKey("refund-" + transactionId)
                .fromUserId(original.getToUserId())
                .toUserId(original.getFromUserId())
                .fromWalletId(original.getToWalletId())
                .toWalletId(original.getFromWalletId())
                .amount(original.getAmount())
                .currency(original.getCurrency())
                .type(TransactionType.REFUND)
                .status(TransactionStatus.COMPLETED)
                .description("Refund for transaction: " + transactionId)
                .referenceId(transactionId.toString())
                .build();
        transactionRepository.save(refundTx);

        log.info("Refund completed for txId={} by={}", transactionId, requestedBy);
        return toResponse(original);
    }

    private TransactionResponse toResponse(Transaction t) {
        return TransactionResponse.builder()
                .id(t.getId())
                .idempotencyKey(t.getIdempotencyKey())
                .fromUserId(t.getFromUserId())
                .toUserId(t.getToUserId())
                .fromWalletId(t.getFromWalletId())
                .toWalletId(t.getToWalletId())
                .amount(t.getAmount())
                .currency(t.getCurrency())
                .type(t.getType())
                .status(t.getStatus())
                .description(t.getDescription())
                .failureReason(t.getFailureReason())
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .build();
    }
}
