package com.globepay.wallet.service;

import com.globepay.shared.exception.BusinessException;
import com.globepay.shared.exception.DuplicateResourceException;
import com.globepay.shared.exception.ResourceNotFoundException;
import com.globepay.wallet.dto.CreateWalletRequest;
import com.globepay.wallet.dto.WalletResponse;
import com.globepay.wallet.entity.Currency;
import com.globepay.wallet.entity.Wallet;
import com.globepay.wallet.entity.WalletStatus;
import com.globepay.wallet.repository.WalletRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
class WalletServiceTest {

    @Mock WalletRepository walletRepository;
    @Mock ExchangeRateService exchangeRateService;
    @Mock RedissonClient redissonClient;
    @Mock RLock rLock;

    @InjectMocks WalletService walletService;

    private static final String USER_ID = "user-123";
    private static final UUID WALLET_ID = UUID.randomUUID();

    @BeforeEach
    void setUp() throws InterruptedException {
        lenient().when(redissonClient.getLock(anyString())).thenReturn(rLock);
        lenient().when(rLock.tryLock(anyLong(), anyLong(), any(TimeUnit.class))).thenReturn(true);
        lenient().when(rLock.isHeldByCurrentThread()).thenReturn(true);
    }

    // -----------------------------------------------------------------------
    // createWallet
    // -----------------------------------------------------------------------

    @Test
    void createWallet_success() {
        when(walletRepository.existsByUserIdAndCurrency(USER_ID, Currency.USD)).thenReturn(false);
        Wallet saved = wallet(WALLET_ID, BigDecimal.ZERO, WalletStatus.ACTIVE);
        when(walletRepository.save(any(Wallet.class))).thenReturn(saved);

        WalletResponse response = walletService.createWallet(USER_ID, createRequest(Currency.USD));

        assertThat(response.getCurrency()).isEqualTo(Currency.USD);
        assertThat(response.getBalance()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void createWallet_duplicateCurrency_throws() {
        when(walletRepository.existsByUserIdAndCurrency(USER_ID, Currency.USD)).thenReturn(true);

        assertThatThrownBy(() -> walletService.createWallet(USER_ID, createRequest(Currency.USD)))
                .isInstanceOf(DuplicateResourceException.class);
    }

    // -----------------------------------------------------------------------
    // getWallets
    // -----------------------------------------------------------------------

    @Test
    void getWallets_returnsMappedList() {
        when(walletRepository.findByUserId(USER_ID)).thenReturn(
                List.of(wallet(WALLET_ID, BigDecimal.TEN, WalletStatus.ACTIVE)));

        List<WalletResponse> wallets = walletService.getWallets(USER_ID);

        assertThat(wallets).hasSize(1);
        assertThat(wallets.get(0).getBalance()).isEqualByComparingTo(BigDecimal.TEN);
    }

    // -----------------------------------------------------------------------
    // debit
    // -----------------------------------------------------------------------

    @Test
    void debit_success_reducesBalance() {
        Wallet w = wallet(WALLET_ID, new BigDecimal("500.00"), WalletStatus.ACTIVE);
        when(walletRepository.findByIdWithLock(WALLET_ID)).thenReturn(Optional.of(w));
        when(walletRepository.save(w)).thenReturn(w);

        WalletResponse response = walletService.debit(WALLET_ID, new BigDecimal("200.00"));

        assertThat(response.getBalance()).isEqualByComparingTo("300.00");
    }

    @Test
    void debit_insufficientBalance_throws() {
        Wallet w = wallet(WALLET_ID, new BigDecimal("50.00"), WalletStatus.ACTIVE);
        when(walletRepository.findByIdWithLock(WALLET_ID)).thenReturn(Optional.of(w));

        assertThatThrownBy(() -> walletService.debit(WALLET_ID, new BigDecimal("200.00")))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Insufficient balance");
    }

    @Test
    void debit_inactiveWallet_throws() {
        Wallet w = wallet(WALLET_ID, new BigDecimal("500.00"), WalletStatus.FROZEN);
        when(walletRepository.findByIdWithLock(WALLET_ID)).thenReturn(Optional.of(w));

        assertThatThrownBy(() -> walletService.debit(WALLET_ID, new BigDecimal("100.00")))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("not active");
    }

    @Test
    void debit_walletNotFound_throws() {
        when(walletRepository.findByIdWithLock(WALLET_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> walletService.debit(WALLET_ID, BigDecimal.ONE))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void debit_lockNotAcquired_throwsConflict() throws InterruptedException {
        when(rLock.tryLock(anyLong(), anyLong(), any(TimeUnit.class))).thenReturn(false);

        assertThatThrownBy(() -> walletService.debit(WALLET_ID, BigDecimal.ONE))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("locked");
    }

    // -----------------------------------------------------------------------
    // credit
    // -----------------------------------------------------------------------

    @Test
    void credit_success_addsToBalance() {
        Wallet w = wallet(WALLET_ID, new BigDecimal("100.00"), WalletStatus.ACTIVE);
        when(walletRepository.findByIdWithLock(WALLET_ID)).thenReturn(Optional.of(w));
        when(walletRepository.save(w)).thenReturn(w);

        WalletResponse response = walletService.credit(WALLET_ID, new BigDecimal("250.00"));

        assertThat(response.getBalance()).isEqualByComparingTo("350.00");
    }

    @Test
    void credit_inactiveWallet_throws() {
        Wallet w = wallet(WALLET_ID, BigDecimal.ZERO, WalletStatus.FROZEN);
        when(walletRepository.findByIdWithLock(WALLET_ID)).thenReturn(Optional.of(w));

        assertThatThrownBy(() -> walletService.credit(WALLET_ID, BigDecimal.ONE))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("not active");
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    private Wallet wallet(UUID id, BigDecimal balance, WalletStatus status) {
        return Wallet.builder()
                .id(id)
                .userId(USER_ID)
                .currency(Currency.USD)
                .balance(balance)
                .status(status)
                .build();
    }

    private CreateWalletRequest createRequest(Currency currency) {
        CreateWalletRequest req = new CreateWalletRequest();
        req.setCurrency(currency);
        return req;
    }
}
