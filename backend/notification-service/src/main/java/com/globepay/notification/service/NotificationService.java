package com.globepay.notification.service;

import com.globepay.notification.entity.Notification;
import com.globepay.notification.entity.NotificationChannel;
import com.globepay.notification.entity.NotificationStatus;
import com.globepay.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @Transactional
    public void sendEmail(String userId, String recipient, String subject, String body) {
        Notification notification = Notification.builder()
                .userId(userId)
                .recipient(recipient)
                .channel(NotificationChannel.EMAIL)
                .subject(subject)
                .body(body)
                .status(NotificationStatus.PENDING)
                .build();
        notification = notificationRepository.save(notification);

        // Simulate email sending
        log.info("[EMAIL SIMULATION] To={} Subject={} Body={}", recipient, subject, body);
        notification.setStatus(NotificationStatus.SENT);
        notification.setSentAt(LocalDateTime.now());
        notificationRepository.save(notification);
    }

    @Transactional
    public void sendSms(String userId, String phone, String message) {
        Notification notification = Notification.builder()
                .userId(userId)
                .recipient(phone)
                .channel(NotificationChannel.SMS)
                .subject("SMS Alert")
                .body(message)
                .status(NotificationStatus.PENDING)
                .build();
        notification = notificationRepository.save(notification);

        // Simulate SMS sending
        log.info("[SMS SIMULATION] To={} Message={}", phone, message);
        notification.setStatus(NotificationStatus.SENT);
        notification.setSentAt(LocalDateTime.now());
        notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public Page<Notification> getNotifications(String userId, Pageable pageable) {
        return notificationRepository.findByUserId(userId, pageable);
    }
}
