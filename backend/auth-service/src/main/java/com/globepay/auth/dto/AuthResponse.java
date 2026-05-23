package com.globepay.auth.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class AuthResponse {
    String userId;
    String email;
    String accessToken;
    String refreshToken;
    String tokenType;
}
