package com.globepay.auth.repository;

import com.globepay.auth.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, String> {
    Optional<RefreshToken> findByToken(String token);
    long deleteByExpiresAtBefore(LocalDateTime cutOff);
    long deleteByUserId(String userId);
}
