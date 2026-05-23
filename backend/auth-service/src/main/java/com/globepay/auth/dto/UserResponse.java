package com.globepay.auth.dto;

import com.globepay.auth.entity.Role;
import com.globepay.auth.entity.UserStatus;
import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;
import java.util.Set;

@Value
@Builder
public class UserResponse {
    String id;
    String email;
    String firstName;
    String lastName;
    Set<Role> roles;
    UserStatus status;
    LocalDateTime lastLoginAt;
}
