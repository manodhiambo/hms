package com.helvinotech.hms.repository;

import com.helvinotech.hms.entity.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {
    List<Prescription> findByVisitId(Long visitId);

    // Tenant-scoped
    List<Prescription> findByHospitalIdAndDispensedFalse(Long hospitalId);
    List<Prescription> findByHospitalIdAndDispensedTrueOrderByDispensedAtDesc(Long hospitalId);

    @Query("SELECT COUNT(p) FROM Prescription p WHERE p.hospitalId = :hospitalId AND p.createdAt BETWEEN :start AND :end")
    long countInRange(@Param("hospitalId") Long hospitalId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(p) FROM Prescription p WHERE p.hospitalId = :hospitalId AND p.createdAt BETWEEN :start AND :end AND p.dispensed = true")
    long countDispensedInRange(@Param("hospitalId") Long hospitalId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    // Legacy
    List<Prescription> findByDispensedFalse();
    List<Prescription> findByDispensedTrueOrderByDispensedAtDesc();

    @Query("SELECT COUNT(p) FROM Prescription p WHERE p.createdAt BETWEEN :start AND :end")
    long countInRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(p) FROM Prescription p WHERE p.createdAt BETWEEN :start AND :end AND p.dispensed = true")
    long countDispensedInRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Modifying
    @Query("UPDATE Prescription p SET p.dispensedBy = null WHERE p.dispensedBy.id = :userId")
    void nullifyDispensedBy(@Param("userId") Long userId);

    void deleteByVisitId(Long visitId);

    boolean existsByVisitIdAndDrugId(Long visitId, Long drugId);
}
