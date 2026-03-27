package com.helvinotech.hms.repository;

import com.helvinotech.hms.entity.InsuranceClaim;
import com.helvinotech.hms.enums.ClaimStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InsuranceClaimRepository extends JpaRepository<InsuranceClaim, Long> {
    Page<InsuranceClaim> findByStatus(ClaimStatus status, Pageable pageable);
    Page<InsuranceClaim> findByPatientId(Long patientId, Pageable pageable);
    void deleteByBillingId(Long billingId);
}
