package com.globepay.auth.service;

import com.globepay.auth.dto.AuthResponse;
import com.globepay.auth.dto.LoginRequest;
import com.globepay.auth.dto.RefreshTokenRequest;
import com.globepay.auth.dto.RegisterRequest;
import com.globepay.auth.dto.UserResponse;
import com.globepay.auth.entity.RefreshToken;
import com.globepay.auth.entity.Role;
import com.globepay.auth.entity.User;
import com.globepay.auth.entity.UserStatus;
import com.globepay.auth.kafka.AuthEventPublisher;
import com.globepay.auth.repository.RefreshTokenRepository;
import com.globepay.auth.repository.UserRepository;
import com.globepay.auth.security.JwtService;
import com.globepay.auth.security.TokenBlacklistService;
import com.globepay.shared.event.UserRegisteredEvent;
import com.globepay.shared.exception.DuplicateResourceException;
import com.globepay.shared.exception.ResourceNotFoundException;
import com.globepay.shared.exception.UnauthorizedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.Set;

@Service
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final TokenBlacklistService tokenBlacklistService;
    private final AuthEventPublisher eventPublisher;

    public AuthService(UserRepository userRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       TokenBlacklistService tokenBlacklistService,
                       AuthEventPublisher eventPublisher) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.tokenBlacklistService = tokenBlacklistService;
        this.eventPublisher = eventPublisher;
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email is already registered");
        }

        Set<Role> roles = EnumSet.of(Role.ROLE_USER);
        User user = User.builder()
                .email(request.getEmail().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .roles(roles)
                .status(UserStatus.ACTIVE)
                .lastLoginAt(LocalDateTime.now())
                .build();
        user = userRepository.save(user);

        String accessToken = jwtService.generateAccessToken(user.getId(), user.getEmail(), user.getRoles());
        String refreshTokenValue = jwtService.generateRefreshToken(user.getId(), user.getEmail(), user.getRoles());
        persistRefreshToken(user.getId(), refreshTokenValue);
        eventPublisher.publishUserRegistered(UserRegisteredEvent.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .registeredAt(LocalDateTime.now())
                .build());

        return buildResponse(user, accessToken, refreshTokenValue);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail().toLowerCase())
                .orElseThrow(() -> new UnauthorizedException("Invalid credentials"));
        if (user.getStatus() != UserStatus.ACTIVE || !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid credentials");
        }
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        String accessToken = jwtService.generateAccessToken(user.getId(), user.getEmail(), user.getRoles());
        String refreshTokenValue = jwtService.generateRefreshToken(user.getId(), user.getEmail(), user.getRoles());
        persistRefreshToken(user.getId(), refreshTokenValue);
        return buildResponse(user, accessToken, refreshTokenValue);
    }

    public AuthResponse refresh(RefreshTokenRequest request) {
        RefreshToken storedToken = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));
        if (storedToken.isRevoked() || storedToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new UnauthorizedException("Refresh token expired");
        }
        User user = userRepository.findById(storedToken.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        String accessToken = jwtService.generateAccessToken(user.getId(), user.getEmail(), user.getRoles());
        return buildResponse(user, accessToken, storedToken.getToken());
    }

    public void logout(RefreshTokenRequest request) {
        RefreshToken storedToken = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));
        storedToken.setRevoked(true);
        refreshTokenRepository.save(storedToken);
        tokenBlacklistService.blacklist(storedToken.getToken(), 3600);
    }

    @Transactional(readOnly = true)
    public UserResponse currentUser(String email) {
        User user = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .roles(user.getRoles())
                .status(user.getStatus())
                .lastLoginAt(user.getLastLoginAt())
                .build();
    }

    private void persistRefreshToken(String userId, String token) {
        refreshTokenRepository.deleteByUserId(userId);
        RefreshToken refreshToken = RefreshToken.builder()
                .token(token)
                .userId(userId)
                .expiresAt(LocalDateTime.now().plusDays(7))
                .revoked(false)
                .build();
        refreshTokenRepository.save(refreshToken);
    }

    private AuthResponse buildResponse(User user, String accessToken, String refreshToken) {
        return AuthResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .build();
    }
}
