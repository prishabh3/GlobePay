package com.globepay.user.kafka;

import com.globepay.shared.event.UserRegisteredEvent;
import com.globepay.user.service.UserProfileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserEventConsumer {

    private final UserProfileService userProfileService;

    @KafkaListener(topics = "user-registered", groupId = "user-service")
    public void onUserRegistered(UserRegisteredEvent event) {
        log.info("Received UserRegisteredEvent for userId={}", event.getUserId());
        try {
            userProfileService.createProfile(
                    event.getUserId(),
                    event.getEmail(),
                    event.getFirstName(),
                    event.getLastName()
            );
        } catch (Exception e) {
            log.error("Failed to create profile for userId={}", event.getUserId(), e);
        }
    }
}
