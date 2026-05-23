package com.globepay.transaction.service;

import com.globepay.shared.event.MoneyTransferredEvent;
import com.globepay.shared.exception.BusinessException;
import com.globepay.shared.exception.ResourceNotFoundException;
import com.globepay.transaction.client.WalletClient;
import com.globepay.transaction.dto.TransactionResponse;
import com.globepay.transaction.dto.TransferRequest;
import com.globepay.transaction.entity.Transaction;
import com.globepay.transaction.entity.TransactionStatus;
import com.globepay.transaction.entity.TransactionType;
import com.globepay.transaction.kafka.TransactionEventPublisher;
import com.globepay.transaction.repository.TransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
class TransactionServiceTest {

    @Mock TransactionRepository transactionRepository;
    @Mock WalletClient walletClient;
    @Mock TransactionEventPublisher eventPublisher;
    @Mock StringRedisTemplate redisTemplate;
    @Mock ValueOperations<String, String> valueOps;

    @InjectMocks TransactionService transactionService;

    private static final String FROM_USER = "user-from";
    private static final String TO_USER   = "user-to";
    private static final UUID FROM_WALLET = UUID.randomUUID();
    private static final UUID TO_WALLET   = UUID.randomUUID();
    private static final UUID TX_ID       = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOps);
    }

    // -----------------------------------------------------------------------
    // transfer — happy path
    // -----------------------------------------------------------------------

    @Test
    void transfer_newKey_executesAndPublishes() {
        when(valueOps.get(anyString())).thenReturn(null);
        when(transactionRepository.findByIdempotencyKey(anyString())).thenReturn(Optional.empty());

        Transaction saved = pendingTx(TransactionStatus.PROCESSING);
        Transaction completed = pendingTx(TransactionStatus.COMPLETED);
        when(transactionRepository.save(any())).thenReturn(saved, completed);

        TransactionResponse res = transactionService.transfer(FROM_USER, transferRequest("key-1"));

        assertThat(res.getStatus()).isEqualTo(TransactionStatus.COMPLETED);
        verify(walletClient).debit(eq(FROM_WALLET), anyString(), any(BigDecimal.class));
        verify(walletClient).credit(eq(TO_WALLET), anyString(), any(BigDecimal.class));
        verify(eventPublisher).publishMoneyTransferred(any(MoneyTransferredEvent.class));
        verify(valueOps).set(anyString(), anyString(), anyLong(), any());
    }

    // -----------------------------------------------------------------------
    // transfer — idempotency (Redis hit)
    // -----------------------------------------------------------------------

    @Test
    void transfer_redisIdempotencyHit_returnsExistingTx() {
        when(valueOps.get(anyString())).thenReturn(TX_ID.toString());
        Transaction existing = pendingTx(TransactionStatus.COMPLETED);
        when(transactionRepository.findById(TX_ID)).thenReturn(Optional.of(existing));

        TransactionResponse res = transactionService.transfer(FROM_USER, transferRequest("key-dup"));

        assertThat(res.getStatus()).isEqualTo(TransactionStatus.COMPLETED);
        verify(walletClient, never()).debit(any(), any(), any());
        verify(walletClient, never()).credit(any(), any(), any());
    }

    // -----------------------------------------------------------------------
    // transfer — idempotency (DB hit)
    // -----------------------------------------------------------------------

    @Test
    void transfer_dbIdempotencyHit_returnsExistingTx() {
        when(valueOps.get(anyString())).thenReturn(null);
        Transaction existing = pendingTx(TransactionStatus.COMPLETED);
        when(transactionRepository.findByIdempotencyKey("key-db")).thenReturn(Optional.of(existing));

        TransactionResponse res = transactionService.transfer(FROM_USER, transferRequest("key-db"));

        assertThat(res.getStatus()).isEqualTo(TransactionStatus.COMPLETED);
        verify(walletClient, never()).debit(any(), any(), any());
    }

    // -----------------------------------------------------------------------
    // transfer — wallet client failure marks FAILED
    // -----------------------------------------------------------------------

    @Test
    void transfer_walletClientFails_marksFailedAndThrows() {
        when(valueOps.get(anyString())).thenReturn(null);
        when(transactionRepository.findByIdempotencyKey(anyString())).thenReturn(Optional.empty());
        Transaction saved = pendingTx(TransactionStatus.PROCESSING);
        when(transactionRepository.save(any())).thenReturn(saved);
        doThrow(new RuntimeException("wallet down")).when(walletClient).debit(any(), any(), any());

        assertThatThrownBy(() -> transactionService.transfer(FROM_USER, transferRequest("key-fail")))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Transfer failed");

        // Two saves: first PROCESSING, then FAILED
        verify(transactionRepository, times(2)).save(any());
        verify(eventPublisher, never()).publishMoneyTransferred(any());
    }

    // -----------------------------------------------------------------------
    // getTransaction
    // -----------------------------------------------------------------------

    @Test
    void getTransaction_found_returnsResponse() {
        when(transactionRepository.findById(TX_ID)).thenReturn(Optional.of(pendingTx(TransactionStatus.COMPLETED)));

        TransactionResponse res = transactionService.getTransaction(TX_ID);

        assertThat(res.getFromUserId()).isEqualTo(FROM_USER);
    }

    @Test
    void getTransaction_notFound_throws() {
        when(transactionRepository.findById(TX_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> transactionService.getTransaction(TX_ID))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // -----------------------------------------------------------------------
    // refund
    // -----------------------------------------------------------------------

    @Test
    void refund_completedTx_reversesAndCreatesRefundRecord() {
        Transaction original = pendingTx(TransactionStatus.COMPLETED);
        when(transactionRepository.findById(TX_ID)).thenReturn(Optional.of(original));
        when(transactionRepository.save(any())).thenReturn(original);

        transactionService.refund(TX_ID, "admin-user");

        verify(walletClient).credit(eq(FROM_WALLET), anyString(), any(BigDecimal.class));
        verify(walletClient).debit(eq(TO_WALLET), anyString(), any(BigDecimal.class));

        ArgumentCaptor<Transaction> captor = ArgumentCaptor.forClass(Transaction.class);
        verify(transactionRepository, times(2)).save(captor.capture());

        // First save: mark original REFUNDED; second save: refund transaction record
        assertThat(captor.getAllValues().get(0).getStatus()).isEqualTo(TransactionStatus.REFUNDED);
        assertThat(captor.getAllValues().get(1).getType()).isEqualTo(TransactionType.REFUND);
    }

    @Test
    void refund_notCompletedTx_throws() {
        Transaction original = pendingTx(TransactionStatus.FAILED);
        when(transactionRepository.findById(TX_ID)).thenReturn(Optional.of(original));

        assertThatThrownBy(() -> transactionService.refund(TX_ID, "admin"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("completed");
    }

    @Test
    void refund_notFound_throws() {
        when(transactionRepository.findById(TX_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> transactionService.refund(TX_ID, "admin"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    private Transaction pendingTx(TransactionStatus status) {
        return Transaction.builder()
                .id(TX_ID)
                .idempotencyKey("key-1")
                .fromUserId(FROM_USER)
                .toUserId(TO_USER)
                .fromWalletId(FROM_WALLET)
                .toWalletId(TO_WALLET)
                .amount(new BigDecimal("100.00"))
                .currency("USD")
                .type(TransactionType.TRANSFER)
                .status(status)
                .build();
    }

    private TransferRequest transferRequest(String idempotencyKey) {
        TransferRequest req = new TransferRequest();
        req.setIdempotencyKey(idempotencyKey);
        req.setFromWalletId(FROM_WALLET);
        req.setToWalletId(TO_WALLET);
        req.setToUserId(TO_USER);
        req.setAmount(new BigDecimal("100.00"));
        req.setCurrency("USD");
        return req;
    }
}
