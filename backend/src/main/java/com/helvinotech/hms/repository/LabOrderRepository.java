package com.helvinotech.hms.repository;

import com.helvinotech.hms.entity.LabOrder;
import com.helvinotech.hms.enums.LabOrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface LabOrderRepository extends JpaRepository<LabOrder, Long> {
    List<LabOrder> findByVisitId(Long visitId);

    // Tenant-scoped
    Page<LabOrder> findByHospitalIdAndStatus(Long hospitalId, LabOrderStatus status, Pageable pageable);
    long countByHospitalIdAndStatus(Long hospitalId, LabOrderStatus status);

    @Query("SELECT COUNT(lo) FROM LabOrder lo WHERE lo.hospitalId = :hospitalId AND lo.createdAt BETWEEN :start AND :end")
    long countInRange(@Param("hospitalId") Long hospitalId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(lo) FROM LabOrder lo WHERE lo.hospitalId = :hospitalId AND lo.createdAt BETWEEN :start AND :end AND lo.abnormal = true")
    long countAbnormalInRange(@Param("hospitalId") Long hospitalId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(lo) FROM LabOrder lo WHERE lo.hospitalId = :hospitalId AND lo.createdAt BETWEEN :start AND :end AND lo.status IN ('COMPLETED', 'VERIFIED', 'RELEASED')")
    long countCompletedInRange(@Param("hospitalId") Long hospitalId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT lo.test.category, COUNT(lo) FROM LabOrder lo WHERE lo.hospitalId = :hospitalId AND lo.createdAt BETWEEN :start AND :end GROUP BY lo.test.category ORDER BY COUNT(lo) DESC")
    List<Object[]> countByTestCategoryInRange(@Param("hospitalId") Long hospitalId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT lo FROM LabOrder lo WHERE lo.hospitalId = :hospitalId AND lo.status = :status AND (LOWER(lo.visit.patient.fullName) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(lo.visit.patient.patientNo) LIKE LOWER(CONCAT('%', :q, '%')))")
    Page<LabOrder> findByHospitalIdAndStatusAndPatientSearch(@Param("hospitalId") Long hospitalId, @Param("status") LabOrderStatus status, @Param("q") String q, Pageable pageable);

    // Legacy
    Page<LabOrder> findByStatus(LabOrderStatus status, Pageable pageable);
    long countByStatus(LabOrderStatus status);

    @Query("SELECT COUNT(lo) FROM LabOrder lo WHERE lo.createdAt BETWEEN :start AND :end")
    long countInRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(lo) FROM LabOrder lo WHERE lo.createdAt BETWEEN :start AND :end AND lo.abnormal = true")
    long countAbnormalInRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(lo) FROM LabOrder lo WHERE lo.createdAt BETWEEN :start AND :end AND lo.status IN ('COMPLETED', 'VERIFIED', 'RELEASED')")
    long countCompletedInRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT lo.test.category, COUNT(lo) FROM LabOrder lo WHERE lo.createdAt BETWEEN :start AND :end GROUP BY lo.test.category ORDER BY COUNT(lo) DESC")
    List<Object[]> countByTestCategoryInRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT lo FROM LabOrder lo WHERE lo.status = :status AND (LOWER(lo.visit.patient.fullName) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(lo.visit.patient.patientNo) LIKE LOWER(CONCAT('%', :q, '%')))")
    Page<LabOrder> findByStatusAndPatientSearch(@Param("status") LabOrderStatus status, @Param("q") String q, Pageable pageable);

    @Modifying
    @Query("UPDATE LabOrder lo SET lo.orderedBy = null WHERE lo.orderedBy.id = :userId")
    void nullifyOrderedBy(@Param("userId") Long userId);

    @Modifying
    @Query("UPDATE LabOrder lo SET lo.processedBy = null WHERE lo.processedBy.id = :userId")
    void nullifyProcessedBy(@Param("userId") Long userId);

    @Modifying
    @Query("UPDATE LabOrder lo SET lo.verifiedBy = null WHERE lo.verifiedBy.id = :userId")
    void nullifyVerifiedBy(@Param("userId") Long userId);

    void deleteByVisitId(Long visitId);
}
