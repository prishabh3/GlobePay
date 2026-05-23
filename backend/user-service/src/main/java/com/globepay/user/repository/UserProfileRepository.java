package com.globepay.user.repository;

import com.globepay.user.entity.KycStatus;
import com.globepay.user.entity.UserProfile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserProfileRepository extends JpaRepository<UserProfile, String> {
    Optional<UserProfile> findByEmail(String email);
    Page<UserProfile> findByKycStatus(KycStatus kycStatus, Pageable pageable);
    boolean existsByEmail(String email);
}
