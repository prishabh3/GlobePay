package com.globepay.notification.kafka;

import com.globepay.notification.service.NotificationService;
import com.globepay.shared.event.CardIssuedEvent;
import com.globepay.shared.event.KYCApprovedEvent;
import com.globepay.shared.event.MoneyTransferredEvent;
import com.globepay.shared.event.UserRegisteredEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationEventConsumer {

    private final NotificationService notificationService;

    @KafkaListener(topics = "user-registered", groupId = "notification-service")
    public void onUserRegistered(UserRegisteredEvent event) {
        log.info("Sending welcome notification to userId={}", event.getUserId());
        notificationService.sendEmail(
                event.getUserId(),
                event.getEmail(),
                "Welcome to GlobePay!",
                String.format("Hi %s, welcome to GlobePay! Your account has been created successfully.",
                        event.getFirstName())
        );
    }

    @KafkaListener(topics = "kyc-approved", groupId = "notification-service")
    public void onKycApproved(KYCApprovedEvent event) {
        log.info("Sending KYC approval notification to userId={}", event.getUserId());
        notificationService.sendEmail(
                event.getUserId(),
                event.getUserId(),
                "KYC Approved — Full Access Unlocked",
                "Congratulations! Your KYC verification has been approved. You now have full access to GlobePay services."
        );
    }

    @KafkaListener(topics = "money-transferred", groupId = "notification-service")
    public void onMoneyTransferred(MoneyTransferredEvent event) {
        log.info("Sending transfer notification for txId={}", event.getTransactionId());
        notificationService.sendEmail(
                event.getFromUserId(),
                event.getFromUserId(),
                "Transfer Confirmed",
                String.format("Your transfer of %s %s has been completed successfully. Transaction ID: %s",
                        event.getAmount(), event.getCurrency(), event.getTransactionId())
        );
        notificationService.sendEmail(
                event.getToUserId(),
                event.getToUserId(),
                "Funds Received",
                String.format("You have received %s %s. Transaction ID: %s",
                        event.getAmount(), event.getCurrency(), event.getTransactionId())
        );
    }

    @KafkaListener(topics = "card-issued", groupId = "notification-service")
    public void onCardIssued(CardIssuedEvent event) {
        log.info("Sending card issued notification to userId={}", event.getUserId());
        notificationService.sendEmail(
                event.getUserId(),
                event.getUserId(),
                "Your Virtual Card is Ready",
                String.format("Your virtual %s card ending in %s has been issued successfully.",
                        event.getCardType(), event.getLast4Digits())
        );
    }
}
