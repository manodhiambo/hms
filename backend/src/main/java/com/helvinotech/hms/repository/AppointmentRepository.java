package com.helvinotech.hms.repository;

import com.helvinotech.hms.entity.Appointment;
import com.helvinotech.hms.enums.AppointmentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByDoctorIdAndAppointmentDate(Long doctorId, LocalDate date);
    Page<Appointment> findByPatientIdOrderByAppointmentDateDesc(Long patientId, Pageable pageable);
    List<Appointment> findByAppointmentDateAndStatus(LocalDate date, AppointmentStatus status);
    Page<Appointment> findByAppointmentDate(LocalDate date, Pageable pageable);
    long countByAppointmentDateAndStatus(LocalDate date, AppointmentStatus status);
    void deleteByPatientId(Long patientId);
}
