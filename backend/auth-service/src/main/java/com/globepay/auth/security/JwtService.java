package com.globepay.auth.security;

import com.globepay.auth.entity.Role;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class JwtService {

    private final SecretKey key;
    private final long accessTokenExpirationMs;
    private final long refreshTokenExpirationMs;

    public JwtService(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration}") long accessTokenExpirationMs,
            @Value("${jwt.refresh-expiration}") long refreshTokenExpirationMs) {
        this.key = buildKey(secret);
        this.accessTokenExpirationMs = accessTokenExpirationMs;
        this.refreshTokenExpirationMs = refreshTokenExpirationMs;
    }

    public String generateAccessToken(String userId, String email, Set<Role> roles) {
        return buildToken(userId, email, roles, accessTokenExpirationMs);
    }

    public String generateRefreshToken(String userId, String email, Set<Role> roles) {
        return buildToken(userId, email, roles, refreshTokenExpirationMs);
    }

    public Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String extractUserId(String token) {
        return parseClaims(token).getSubject();
    }

    public String extractEmail(String token) {
        return parseClaims(token).get("email", String.class);
    }

    public List<String> extractRoles(String token) {
        Object value = parseClaims(token).get("roles");
        if (value instanceof List<?> list) {
            return list.stream().map(Object::toString).toList();
        }
        return List.of();
    }

    public boolean isTokenValid(String token) {
        Claims claims = parseClaims(token);
        return claims.getExpiration() != null && claims.getExpiration().after(new Date());
    }

    public LocalDateTime getExpirationDate(String token) {
        return Instant.ofEpochMilli(parseClaims(token).getExpiration().getTime()).atZone(ZoneOffset.UTC).toLocalDateTime();
    }

    private String buildToken(String userId, String email, Set<Role> roles, long expirationMs) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(userId)
                .claims(Map.of(
                        "email", email,
                        "roles", roles.stream().map(Enum::name).collect(Collectors.toSet())
                ))
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(expirationMs)))
                .signWith(key)
                .compact();
    }

    private SecretKey buildKey(String secret) {
        byte[] bytes = secret.length() >= 64 ? Decoders.BASE64.decode(secret) : secret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(bytes);
    }
}
