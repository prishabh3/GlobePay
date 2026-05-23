package com.globepay.wallet.service;

import com.globepay.shared.exception.BusinessException;
import com.globepay.shared.exception.DuplicateResourceException;
import com.globepay.shared.exception.ResourceNotFoundException;
import com.globepay.wallet.dto.*;
import com.globepay.wallet.entity.Currency;
import com.globepay.wallet.entity.Wallet;
import com.globepay.wallet.entity.WalletStatus;
import com.globepay.wallet.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class WalletService {

    private final WalletRepository walletRepository;
    private final ExchangeRateService exchangeRateService;
    private final RedissonClient redissonClient;

    @Transactional
    public WalletResponse createWallet(String userId, CreateWalletRequest request) {
        if (walletRepository.existsByUserIdAndCurrency(userId, request.getCurrency())) {
            throw new DuplicateResourceException(
                    "Wallet already exists for currency: " + request.getCurrency());
        }
        Wallet wallet = Wallet.builder()
                .userId(userId)
                .currency(request.getCurrency())
                .balance(BigDecimal.ZERO)
                .status(WalletStatus.ACTIVE)
                .build();
        return toResponse(walletRepository.save(wallet));
    }

    @Transactional(readOnly = true)
    public List<WalletResponse> getWallets(String userId) {
        return walletRepository.findByUserId(userId).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public WalletResponse getWallet(String userId, Currency currency) {
        return walletRepository.findByUserIdAndCurrency(userId, currency)
                .map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Wallet not found for currency: " + currency));
    }

    @Transactional(readOnly = true)
    public WalletResponse getWalletById(UUID walletId) {
        return walletRepository.findById(walletId)
                .map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found: " + walletId));
    }

    @Transactional
    public WalletResponse debit(UUID walletId, BigDecimal amount) {
        String lockKey = "wallet:lock:" + walletId;
        RLock lock = redissonClient.getLock(lockKey);
        try {
            if (!lock.tryLock(5, 10, TimeUnit.SECONDS)) {
                throw new BusinessException("Wallet is currently locked, please retry", 409);
            }
            Wallet wallet = walletRepository.findByIdWithLock(walletId)
                    .orElseThrow(() -> new ResourceNotFoundException("Wallet not found: " + walletId));
            assertActive(wallet);
            if (wallet.getBalance().compareTo(amount) < 0) {
                throw new BusinessException("Insufficient balance", 422);
            }
            wallet.setBalance(wallet.getBalance().subtract(amount));
            return toResponse(walletRepository.save(wallet));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new BusinessException("Operation interrupted", 500);
        } finally {
            if (lock.isHeldByCurrentThread()) {
                lock.unlock();
            }
        }
    }

    @Transactional
    public WalletResponse credit(UUID walletId, BigDecimal amount) {
        String lockKey = "wallet:lock:" + walletId;
        RLock lock = redissonClient.getLock(lockKey);
        try {
            if (!lock.tryLock(5, 10, TimeUnit.SECONDS)) {
                throw new BusinessException("Wallet is currently locked, please retry", 409);
            }
            Wallet wallet = walletRepository.findByIdWithLock(walletId)
                    .orElseThrow(() -> new ResourceNotFoundException("Wallet not found: " + walletId));
            assertActive(wallet);
            wallet.setBalance(wallet.getBalance().add(amount));
            return toResponse(walletRepository.save(wallet));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new BusinessException("Operation interrupted", 500);
        } finally {
            if (lock.isHeldByCurrentThread()) {
                lock.unlock();
            }
        }
    }

    @Transactional
    public ConvertResponse convert(String userId, ConvertRequest request) {
        Wallet fromWallet = walletRepository.findByUserIdAndCurrency(userId, request.getFromCurrency())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Source wallet not found for currency: " + request.getFromCurrency()));
        Wallet toWallet = walletRepository.findByUserIdAndCurrency(userId, request.getToCurrency())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Target wallet not found for currency: " + request.getToCurrency()));

        assertActive(fromWallet);
        assertActive(toWallet);

        if (fromWallet.getBalance().compareTo(request.getAmount()) < 0) {
            throw new BusinessException("Insufficient balance for conversion", 422);
        }

        BigDecimal rate = exchangeRateService.getRate(request.getFromCurrency(), request.getToCurrency());
        BigDecimal converted = exchangeRateService.convert(request.getAmount(), request.getFromCurrency(), request.getToCurrency());

        fromWallet.setBalance(fromWallet.getBalance().subtract(request.getAmount()));
        toWallet.setBalance(toWallet.getBalance().add(converted));
        walletRepository.save(fromWallet);
        walletRepository.save(toWallet);

        log.info("Converted {} {} -> {} {} for userId={}", request.getAmount(), request.getFromCurrency(),
                converted, request.getToCurrency(), userId);

        return ConvertResponse.builder()
                .fromCurrency(request.getFromCurrency())
                .toCurrency(request.getToCurrency())
                .originalAmount(request.getAmount())
                .convertedAmount(converted)
                .exchangeRate(rate)
                .build();
    }

    private void assertActive(Wallet wallet) {
        if (wallet.getStatus() != WalletStatus.ACTIVE) {
            throw new BusinessException("Wallet is not active: " + wallet.getStatus(), 422);
        }
    }

    private WalletResponse toResponse(Wallet w) {
        return WalletResponse.builder()
                .id(w.getId())
                .userId(w.getUserId())
                .currency(w.getCurrency())
                .balance(w.getBalance())
                .status(w.getStatus())
                .createdAt(w.getCreatedAt())
                .updatedAt(w.getUpdatedAt())
                .build();
    }
}
