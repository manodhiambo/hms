package com.helvinotech.hms.repository;

import com.helvinotech.hms.entity.Admission;
import com.helvinotech.hms.enums.AdmissionStatus;
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
public interface AdmissionRepository extends JpaRepository<Admission, Long> {
    // Tenant-scoped
    java.util.Optional<Admission> findByIdAndHospitalId(Long id, Long hospitalId);
    Page<Admission> findByHospitalIdAndStatus(Long hospitalId, AdmissionStatus status, Pageable pageable);
    List<Admission> findByHospitalIdAndPatientId(Long hospitalId, Long patientId);
    long countByHospitalIdAndStatus(Long hospitalId, AdmissionStatus status);

    @Query("SELECT COUNT(a) FROM Admission a WHERE a.hospitalId = :hospitalId AND a.createdAt BETWEEN :start AND :end")
    long countInRange(@Param("hospitalId") Long hospitalId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(a) FROM Admission a WHERE a.hospitalId = :hospitalId AND a.dischargedAt BETWEEN :start AND :end")
    long countDischargedInRange(@Param("hospitalId") Long hospitalId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    // Legacy / SUPER_ADMIN
    Page<Admission> findByStatus(AdmissionStatus status, Pageable pageable);
    List<Admission> findByPatientId(Long patientId);
    long countByStatus(AdmissionStatus status);

    @Query("SELECT COUNT(a) FROM Admission a WHERE a.createdAt BETWEEN :start AND :end")
    long countInRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(a) FROM Admission a WHERE a.dischargedAt BETWEEN :start AND :end")
    long countDischargedInRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Modifying
    @Query("UPDATE Admission a SET a.admittingDoctor = null WHERE a.admittingDoctor.id = :userId")
    void nullifyAdmittingDoctor(@Param("userId") Long userId);

    void deleteByPatientId(Long patientId);
}
