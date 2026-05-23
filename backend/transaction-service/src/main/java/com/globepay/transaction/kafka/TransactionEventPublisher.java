package com.globepay.transaction.kafka;

import com.globepay.shared.event.MoneyTransferredEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class TransactionEventPublisher {

    private static final String MONEY_TRANSFERRED_TOPIC = "money-transferred";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishMoneyTransferred(MoneyTransferredEvent event) {
        kafkaTemplate.send(MONEY_TRANSFERRED_TOPIC, event.getTransactionId(), event)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to publish MoneyTransferredEvent txId={}", event.getTransactionId(), ex);
                    } else {
                        log.info("Published MoneyTransferredEvent txId={}", event.getTransactionId());
                    }
                });
    }
}
