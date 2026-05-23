package com.globepay.credit.repository;

import com.globepay.credit.entity.CreditProfile;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CreditProfileRepository extends JpaRepository<CreditProfile, String> {
}
