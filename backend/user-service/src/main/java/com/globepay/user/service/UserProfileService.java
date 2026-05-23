package com.globepay.user.service;

import com.globepay.shared.exception.DuplicateResourceException;
import com.globepay.shared.exception.ResourceNotFoundException;
import com.globepay.user.dto.UserProfileRequest;
import com.globepay.user.dto.UserProfileResponse;
import com.globepay.user.entity.KycStatus;
import com.globepay.user.entity.UserProfile;
import com.globepay.user.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserProfileService {

    private final UserProfileRepository userProfileRepository;

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(String userId) {
        return toResponse(findByIdOrThrow(userId));
    }

    @Transactional
    public UserProfileResponse updateProfile(String userId, UserProfileRequest request) {
        UserProfile profile = findByIdOrThrow(userId);
        profile.setFirstName(request.getFirstName());
        profile.setLastName(request.getLastName());
        profile.setPhone(request.getPhone());
        profile.setDateOfBirth(request.getDateOfBirth());
        profile.setNationality(request.getNationality());
        profile.setAddressLine1(request.getAddressLine1());
        profile.setAddressLine2(request.getAddressLine2());
        profile.setCity(request.getCity());
        profile.setCountry(request.getCountry());
        profile.setPostalCode(request.getPostalCode());
        return toResponse(userProfileRepository.save(profile));
    }

    @Transactional
    public UserProfileResponse createProfile(String userId, String email, String firstName, String lastName) {
        if (userProfileRepository.existsById(userId)) {
            log.warn("Profile already exists for userId={}", userId);
            return toResponse(findByIdOrThrow(userId));
        }
        if (userProfileRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("Profile with email already exists");
        }
        UserProfile profile = UserProfile.builder()
                .userId(userId)
                .email(email)
                .firstName(firstName)
                .lastName(lastName)
                .kycStatus(KycStatus.PENDING)
                .build();
        return toResponse(userProfileRepository.save(profile));
    }

    @Transactional(readOnly = true)
    public Page<UserProfileResponse> getAllUsers(Pageable pageable) {
        return userProfileRepository.findAll(pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<UserProfileResponse> getUsersByKycStatus(KycStatus status, Pageable pageable) {
        return userProfileRepository.findByKycStatus(status, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getProfileByAdmin(String userId) {
        return toResponse(findByIdOrThrow(userId));
    }

    @Transactional
    public void updateKycStatus(String userId, KycStatus status) {
        UserProfile profile = findByIdOrThrow(userId);
        profile.setKycStatus(status);
        userProfileRepository.save(profile);
        log.info("KYC status updated for userId={} to {}", userId, status);
    }

    private UserProfile findByIdOrThrow(String userId) {
        return userProfileRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User profile not found for userId: " + userId));
    }

    private UserProfileResponse toResponse(UserProfile p) {
        return UserProfileResponse.builder()
                .userId(p.getUserId())
                .firstName(p.getFirstName())
                .lastName(p.getLastName())
                .email(p.getEmail())
                .phone(p.getPhone())
                .dateOfBirth(p.getDateOfBirth())
                .nationality(p.getNationality())
                .addressLine1(p.getAddressLine1())
                .addressLine2(p.getAddressLine2())
                .city(p.getCity())
                .country(p.getCountry())
                .postalCode(p.getPostalCode())
                .kycStatus(p.getKycStatus())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
