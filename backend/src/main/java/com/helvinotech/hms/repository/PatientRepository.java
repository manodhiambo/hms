package com.helvinotech.hms.repository;

import com.helvinotech.hms.entity.Patient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {
    Optional<Patient> findByPatientNoAndHospitalId(String patientNo, Long hospitalId);
    Optional<Patient> findByPhoneAndHospitalId(String phone, Long hospitalId);
    Optional<Patient> findByIdNumberAndHospitalId(String idNumber, Long hospitalId);
    Optional<Patient> findByIdAndHospitalId(Long id, Long hospitalId);

    Page<Patient> findByHospitalId(Long hospitalId, Pageable pageable);

    @Query("SELECT p FROM Patient p WHERE p.hospitalId = :hospitalId AND (" +
           "LOWER(p.fullName) LIKE LOWER(CONCAT('%', :q, '%')) " +
           "OR LOWER(p.patientNo) LIKE LOWER(CONCAT('%', :q, '%')) " +
           "OR LOWER(p.phone) LIKE LOWER(CONCAT('%', :q, '%')) " +
           "OR LOWER(p.idNumber) LIKE LOWER(CONCAT('%', :q, '%')))")
    Page<Patient> searchPatients(@Param("q") String query, @Param("hospitalId") Long hospitalId, Pageable pageable);

    long countByHospitalIdAndCreatedAtBetween(Long hospitalId, LocalDateTime start, LocalDateTime end);

    // Keep for backward compat / SUPER_ADMIN
    Optional<Patient> findByPatientNo(String patientNo);
    Optional<Patient> findByPhone(String phone);
    Optional<Patient> findByIdNumber(String idNumber);

    @Query("SELECT p FROM Patient p WHERE LOWER(p.fullName) LIKE LOWER(CONCAT('%', :q, '%')) " +
           "OR LOWER(p.patientNo) LIKE LOWER(CONCAT('%', :q, '%')) " +
           "OR LOWER(p.phone) LIKE LOWER(CONCAT('%', :q, '%')) " +
           "OR LOWER(p.idNumber) LIKE LOWER(CONCAT('%', :q, '%'))")
    Page<Patient> searchPatients(@Param("q") String query, Pageable pageable);

    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
}
