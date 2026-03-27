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
