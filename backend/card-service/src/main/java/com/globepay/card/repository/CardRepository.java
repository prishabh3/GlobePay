package com.globepay.card.repository;

import com.globepay.card.entity.Card;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CardRepository extends JpaRepository<Card, UUID> {
    List<Card> findByUserId(String userId);
    Optional<Card> findByIdAndUserId(UUID id, String userId);
    boolean existsByUserId(String userId);
}
