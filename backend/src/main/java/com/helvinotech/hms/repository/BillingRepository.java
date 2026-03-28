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
import java.util.List;
import java.util.Optional;

@Repository
public interface BillingRepository extends JpaRepository<Billing, Long> {
    // Tenant-scoped
    java.util.Optional<Billing> findByIdAndHospitalId(Long id, Long hospitalId);
    Page<Billing> findByHospitalIdAndPatientIdOrderByCreatedAtDesc(Long hospitalId, Long patientId, Pageable pageable);
    List<Billing> findByHospitalIdAndPatientId(Long hospitalId, Long patientId);
    Page<Billing> findByHospitalIdAndStatus(Long hospitalId, PaymentStatus status, Pageable pageable);
    Page<Billing> findByHospitalId(Long hospitalId, Pageable pageable);
    Optional<Billing> findByHospitalIdAndVisitId(Long hospitalId, Long visitId);

    @Query("SELECT b FROM Billing b JOIN b.patient p WHERE b.hospitalId = :hospitalId AND (" +
           "LOWER(p.fullName) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(b.invoiceNumber) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(p.patientNo) LIKE LOWER(CONCAT('%', :q, '%'))) " +
           "ORDER BY b.createdAt DESC")
    Page<Billing> searchBillings(@Param("hospitalId") Long hospitalId, @Param("q") String q, Pageable pageable);

    @Query("SELECT COALESCE(SUM(b.paidAmount), 0) FROM Billing b WHERE b.hospitalId = :hospitalId AND b.createdAt BETWEEN :start AND :end")
    BigDecimal sumRevenueByDateRange(@Param("hospitalId") Long hospitalId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    // Legacy
    Page<Billing> findByPatientIdOrderByCreatedAtDesc(Long patientId, Pageable pageable);
    List<Billing> findByPatientId(Long patientId);
    Page<Billing> findByStatus(PaymentStatus status, Pageable pageable);
    Optional<Billing> findByVisitId(Long visitId);
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
