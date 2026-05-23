package com.globepay.transaction.repository;

import com.globepay.transaction.entity.Transaction;
import com.globepay.transaction.entity.TransactionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface TransactionRepository extends JpaRepository<Transaction, UUID> {

    Optional<Transaction> findByIdempotencyKey(String idempotencyKey);

    Page<Transaction> findByFromUserIdOrToUserId(String fromUserId, String toUserId, Pageable pageable);

    Page<Transaction> findByFromUserId(String fromUserId, Pageable pageable);

    @Query("SELECT t FROM Transaction t WHERE (t.fromUserId = :userId OR t.toUserId = :userId) AND t.status = :status")
    Page<Transaction> findByUserIdAndStatus(@Param("userId") String userId,
                                            @Param("status") TransactionStatus status,
                                            Pageable pageable);
}
