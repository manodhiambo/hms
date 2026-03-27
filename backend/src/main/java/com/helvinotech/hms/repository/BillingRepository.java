package com.helvinotech.hms.repository;

import com.helvinotech.hms.entity.Billing;
import com.helvinotech.hms.enums.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Repository
public interface BillingRepository extends JpaRepository<Billing, Long> {
    Page<Billing> findByPatientIdOrderByCreatedAtDesc(Long patientId, Pageable pageable);
    java.util.List<Billing> findByPatientId(Long patientId);
    Page<Billing> findByStatus(PaymentStatus status, Pageable pageable);
    java.util.Optional<Billing> findByVisitId(Long visitId);
    void deleteByPatientId(Long patientId);

    @Query("SELECT b FROM Billing b JOIN b.patient p WHERE " +
           "LOWER(p.fullName) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(b.invoiceNumber) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(p.patientNo) LIKE LOWER(CONCAT('%', :q, '%')) " +
           "ORDER BY b.createdAt DESC")
    Page<Billing> searchBillings(@Param("q") String q, Pageable pageable);

    @Query("SELECT COALESCE(SUM(b.paidAmount), 0) FROM Billing b WHERE b.createdAt BETWEEN :start AND :end")
    BigDecimal sumRevenueByDateRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
