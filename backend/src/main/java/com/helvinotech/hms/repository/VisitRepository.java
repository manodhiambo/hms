package com.helvinotech.hms.repository;

import com.helvinotech.hms.entity.Visit;
import com.helvinotech.hms.enums.LabOrderStatus;
import com.helvinotech.hms.enums.TriageStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Modifying;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface VisitRepository extends JpaRepository<Visit, Long> {
    // Patient-scoped
    Page<Visit> findByPatientIdOrderByCreatedAtDesc(Long patientId, Pageable pageable);
    Page<Visit> findByPatientIdAndHospitalIdOrderByCreatedAtDesc(Long patientId, Long hospitalId, Pageable pageable);
    List<Visit> findByPatientId(Long patientId);
    void deleteByPatientId(Long patientId);

    // Single-record tenant-scoped lookup
    java.util.Optional<Visit> findByIdAndHospitalId(Long id, Long hospitalId);

    // Tenant-scoped queries
    List<Visit> findByDoctorIdAndHospitalIdAndCompletedFalseOrderByCreatedAtAsc(Long doctorId, Long hospitalId);
    Page<Visit> findByDoctorIdAndHospitalIdOrderByCreatedAtDesc(Long doctorId, Long hospitalId, Pageable pageable);
    List<Visit> findByHospitalIdAndCompletedFalseOrderByCreatedAtAsc(Long hospitalId);
    List<Visit> findByTriageStatusInAndHospitalIdAndCompletedFalseOrderByCreatedAtAsc(List<TriageStatus> statuses, Long hospitalId);

    long countByHospitalIdAndCreatedAtBetween(Long hospitalId, LocalDateTime start, LocalDateTime end);

    @Query("SELECT DISTINCT v FROM Visit v JOIN v.labOrders lo WHERE v.hospitalId = :hospitalId AND lo.status = :status AND v.completed = false AND v.triageStatus = :triageStatus")
    List<Visit> findVisitsWithReleasedLabResults(@Param("hospitalId") Long hospitalId, @Param("status") LabOrderStatus status, @Param("triageStatus") TriageStatus triageStatus);

    @Query("SELECT v.diagnosis, v.diagnosisCode, COUNT(v) FROM Visit v WHERE v.hospitalId = :hospitalId AND v.createdAt BETWEEN :start AND :end AND v.diagnosis IS NOT NULL GROUP BY v.diagnosis, v.diagnosisCode ORDER BY COUNT(v) DESC")
    List<Object[]> getMorbidityData(@Param("hospitalId") Long hospitalId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT v.visitType, COUNT(v) FROM Visit v WHERE v.hospitalId = :hospitalId AND v.createdAt BETWEEN :start AND :end GROUP BY v.visitType")
    List<Object[]> countByVisitTypeInRange(@Param("hospitalId") Long hospitalId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT p.gender, COUNT(v) FROM Visit v JOIN v.patient p WHERE v.hospitalId = :hospitalId AND v.createdAt BETWEEN :start AND :end GROUP BY p.gender")
    List<Object[]> countByGenderInRange(@Param("hospitalId") Long hospitalId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT v.patient.dateOfBirth FROM Visit v WHERE v.hospitalId = :hospitalId AND v.createdAt BETWEEN :start AND :end AND v.patient.dateOfBirth IS NOT NULL")
    List<LocalDate> findPatientDobsInRange(@Param("hospitalId") Long hospitalId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(v) FROM Visit v WHERE v.hospitalId = :hospitalId AND v.createdAt BETWEEN :start AND :end AND v.patient.createdAt BETWEEN :start AND :end")
    long countNewPatientVisitsInRange(@Param("hospitalId") Long hospitalId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT v FROM Visit v WHERE v.hospitalId = :hospitalId AND (LOWER(v.patient.fullName) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(v.patient.patientNo) LIKE LOWER(CONCAT('%', :q, '%'))) ORDER BY v.createdAt DESC")
    Page<Visit> searchVisits(@Param("hospitalId") Long hospitalId, @Param("q") String q, Pageable pageable);

    // Hard-delete user cleanup
    @Modifying
    @Query("UPDATE Visit v SET v.doctor = null WHERE v.doctor.id = :userId")
    void nullifyDoctor(@Param("userId") Long userId);

    @Modifying
    @Query("UPDATE Visit v SET v.triagedBy = null WHERE v.triagedBy.id = :userId")
    void nullifyTriagedBy(@Param("userId") Long userId);

    // Legacy queries (keep for backward compat)
    List<Visit> findByDoctorIdAndCompletedFalseOrderByCreatedAtAsc(Long doctorId);
    Page<Visit> findByDoctorIdOrderByCreatedAtDesc(Long doctorId, Pageable pageable);
    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    List<Visit> findByCompletedFalseOrderByCreatedAtAsc();
    List<Visit> findByTriageStatusInAndCompletedFalseOrderByCreatedAtAsc(List<TriageStatus> statuses);

    @Query("SELECT DISTINCT v FROM Visit v JOIN v.labOrders lo WHERE lo.status = :status AND v.completed = false AND v.triageStatus = :triageStatus")
    List<Visit> findVisitsWithReleasedLabResults(@Param("status") LabOrderStatus status, @Param("triageStatus") TriageStatus triageStatus);

    @Query("SELECT v.diagnosis, v.diagnosisCode, COUNT(v) FROM Visit v WHERE v.createdAt BETWEEN :start AND :end AND v.diagnosis IS NOT NULL GROUP BY v.diagnosis, v.diagnosisCode ORDER BY COUNT(v) DESC")
    List<Object[]> getMorbidityData(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT v.visitType, COUNT(v) FROM Visit v WHERE v.createdAt BETWEEN :start AND :end GROUP BY v.visitType")
    List<Object[]> countByVisitTypeInRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT p.gender, COUNT(v) FROM Visit v JOIN v.patient p WHERE v.createdAt BETWEEN :start AND :end GROUP BY p.gender")
    List<Object[]> countByGenderInRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT v.patient.dateOfBirth FROM Visit v WHERE v.createdAt BETWEEN :start AND :end AND v.patient.dateOfBirth IS NOT NULL")
    List<LocalDate> findPatientDobsInRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(v) FROM Visit v WHERE v.createdAt BETWEEN :start AND :end AND v.patient.createdAt BETWEEN :start AND :end")
    long countNewPatientVisitsInRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT v FROM Visit v WHERE LOWER(v.patient.fullName) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(v.patient.patientNo) LIKE LOWER(CONCAT('%', :q, '%')) ORDER BY v.createdAt DESC")
    Page<Visit> searchVisits(@Param("q") String q, Pageable pageable);
}
