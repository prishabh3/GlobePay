package com.globepay.wallet.kafka;

import com.globepay.shared.event.KYCApprovedEvent;
import com.globepay.wallet.dto.CreateWalletRequest;
import com.globepay.wallet.entity.Currency;
import com.globepay.wallet.repository.WalletRepository;
import com.globepay.wallet.service.WalletService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class WalletEventConsumer {

    private final WalletService walletService;
    private final WalletRepository walletRepository;

    @KafkaListener(topics = "kyc-approved", groupId = "wallet-service")
    public void onKycApproved(KYCApprovedEvent event) {
        log.info("KYC approved for userId={} — provisioning default wallets", event.getUserId());
        try {
            for (Currency currency : new Currency[]{Currency.USD, Currency.INR}) {
                if (!walletRepository.existsByUserIdAndCurrency(event.getUserId(), currency)) {
                    CreateWalletRequest req = new CreateWalletRequest();
                    req.setCurrency(currency);
                    walletService.createWallet(event.getUserId(), req);
                    log.info("Created {} wallet for userId={}", currency, event.getUserId());
                }
            }
        } catch (Exception e) {
            log.error("Failed to provision wallets for userId={}", event.getUserId(), e);
        }
    }
}
