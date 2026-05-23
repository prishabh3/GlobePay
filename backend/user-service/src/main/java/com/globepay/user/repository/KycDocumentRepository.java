package com.globepay.user.repository;

import com.globepay.user.entity.DocumentType;
import com.globepay.user.entity.KycDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface KycDocumentRepository extends JpaRepository<KycDocument, UUID> {
    List<KycDocument> findByUserId(String userId);
    Optional<KycDocument> findByUserIdAndDocumentType(String userId, DocumentType documentType);
}
