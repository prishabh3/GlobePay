package com.globepay.user.security;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public class GatewayUserPrincipal {
    private final String userId;
    private final String email;

    @Override
    public String toString() {
        return email != null ? email : userId;
    }
}
