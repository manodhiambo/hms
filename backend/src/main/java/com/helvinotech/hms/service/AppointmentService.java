package com.helvinotech.hms.service;

import com.helvinotech.hms.dto.AppointmentDTO;
import com.helvinotech.hms.entity.Appointment;
import com.helvinotech.hms.entity.Patient;
import com.helvinotech.hms.entity.User;
import com.helvinotech.hms.enums.AppointmentStatus;
import com.helvinotech.hms.exception.ResourceNotFoundException;
import com.helvinotech.hms.repository.AppointmentRepository;
import com.helvinotech.hms.repository.PatientRepository;
import com.helvinotech.hms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = false)
    public AppointmentDTO createAppointment(AppointmentDTO dto) {
        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient", dto.getPatientId()));
        User doctor = userRepository.findById(dto.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", dto.getDoctorId()));

        Appointment apt = Appointment.builder()
                .patient(patient)
                .doctor(doctor)
                .department(dto.getDepartment())
                .appointmentDate(dto.getAppointmentDate())
                .appointmentTime(dto.getAppointmentTime())
                .appointmentType(dto.getAppointmentType())
                .notes(dto.getNotes())
                .walkIn(dto.isWalkIn())
                .build();
        apt = appointmentRepository.save(apt);
        return mapToDto(apt);
    }

    public AppointmentDTO getAppointment(Long id) {
        return mapToDto(appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", id)));
    }

    public Page<AppointmentDTO> getAppointmentsByDate(LocalDate date, Pageable pageable) {
        return appointmentRepository.findByAppointmentDate(date, pageable).map(this::mapToDto);
    }

    public Page<AppointmentDTO> getAppointmentsByPatient(Long patientId, Pageable pageable) {
        return appointmentRepository.findByPatientIdOrderByAppointmentDateDesc(patientId, pageable).map(this::mapToDto);
    }

    public List<AppointmentDTO> getDoctorAppointments(Long doctorId, LocalDate date) {
        return appointmentRepository.findByDoctorIdAndAppointmentDate(doctorId, date)
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = false)
    public AppointmentDTO updateStatus(Long id, AppointmentStatus status) {
        Appointment apt = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", id));
        apt.setStatus(status);
        return mapToDto(appointmentRepository.save(apt));
    }

    public long countTodayAppointments() {
        return appointmentRepository.countByAppointmentDateAndStatus(LocalDate.now(), AppointmentStatus.SCHEDULED);
    }

    public Page<AppointmentDTO> getAllAppointments(Pageable pageable) {
        return appointmentRepository.findAll(pageable).map(this::mapToDto);
    }

    private AppointmentDTO mapToDto(Appointment a) {
        AppointmentDTO dto = new AppointmentDTO();
        dto.setId(a.getId());
        dto.setPatientId(a.getPatient().getId());
        dto.setPatientName(a.getPatient().getFullName());
        dto.setDoctorId(a.getDoctor().getId());
        dto.setDoctorName(a.getDoctor().getFullName());
        dto.setDepartment(a.getDepartment());
        dto.setAppointmentDate(a.getAppointmentDate());
        dto.setAppointmentTime(a.getAppointmentTime());
        dto.setAppointmentType(a.getAppointmentType());
        dto.setStatus(a.getStatus());
        dto.setNotes(a.getNotes());
        dto.setWalkIn(a.isWalkIn());
        dto.setCreatedAt(a.getCreatedAt());
        return dto;
    }
}
