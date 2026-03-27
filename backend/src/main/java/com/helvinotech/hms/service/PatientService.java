package com.helvinotech.hms.service;

import com.helvinotech.hms.dto.PatientDTO;
import com.helvinotech.hms.entity.InsuranceCompany;
import com.helvinotech.hms.entity.Patient;
import com.helvinotech.hms.exception.ResourceNotFoundException;
import com.helvinotech.hms.repository.InsuranceCompanyRepository;
import com.helvinotech.hms.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.time.Year;
import java.util.concurrent.atomic.AtomicLong;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PatientService {

    private final PatientRepository patientRepository;
    private final InsuranceCompanyRepository insuranceCompanyRepository;
    private static final AtomicLong counter = new AtomicLong(0);

    @Transactional(readOnly = false)
    public PatientDTO createPatient(PatientDTO dto) {
        // Determine if minor (< 18 years)
        boolean isMinor = dto.getDateOfBirth() != null &&
                Period.between(dto.getDateOfBirth(), LocalDate.now()).getYears() < 18;
        // Phone required for adult patients
        if (!isMinor && (dto.getPhone() == null || dto.getPhone().isBlank())) {
            throw new IllegalArgumentException("Phone number is required for adult patients");
        }
        // Duplicate detection by phone
        if (dto.getPhone() != null && !dto.getPhone().isBlank()) {
            patientRepository.findByPhone(dto.getPhone().trim()).ifPresent(existing -> {
                throw new IllegalStateException("DUPLICATE_PHONE:" + existing.getPatientNo() + ":" + existing.getFullName());
            });
        }
        // Duplicate detection by national ID
        if (dto.getIdNumber() != null && !dto.getIdNumber().isBlank()) {
            patientRepository.findByIdNumber(dto.getIdNumber().trim()).ifPresent(existing -> {
                throw new IllegalStateException("DUPLICATE_ID:" + existing.getPatientNo() + ":" + existing.getFullName());
            });
        }
        Patient patient = new Patient();
        patient.setPatientNo(generatePatientNo());
        mapDtoToEntity(dto, patient);
        patient = patientRepository.save(patient);
        return mapEntityToDto(patient);
    }

    public java.util.List<PatientDTO> checkDuplicates(String phone, String idNumber) {
        java.util.List<PatientDTO> matches = new java.util.ArrayList<>();
        if (phone != null && !phone.isBlank()) {
            patientRepository.findByPhone(phone.trim()).map(this::mapEntityToDto).ifPresent(matches::add);
        }
        if (idNumber != null && !idNumber.isBlank()) {
            patientRepository.findByIdNumber(idNumber.trim())
                    .map(this::mapEntityToDto)
                    .filter(p -> matches.stream().noneMatch(m -> m.getId().equals(p.getId())))
                    .ifPresent(matches::add);
        }
        return matches;
    }

    public PatientDTO getPatient(Long id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient", id));
        return mapEntityToDto(patient);
    }

    public PatientDTO getPatientByNo(String patientNo) {
        Patient patient = patientRepository.findByPatientNo(patientNo)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + patientNo));
        return mapEntityToDto(patient);
    }

    public Page<PatientDTO> getAllPatients(Pageable pageable) {
        return patientRepository.findAll(pageable).map(this::mapEntityToDto);
    }

    public Page<PatientDTO> searchPatients(String query, Pageable pageable) {
        return patientRepository.searchPatients(query, pageable).map(this::mapEntityToDto);
    }

    @Transactional(readOnly = false)
    public PatientDTO updatePatient(Long id, PatientDTO dto) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient", id));
        mapDtoToEntity(dto, patient);
        patient = patientRepository.save(patient);
        return mapEntityToDto(patient);
    }

    public long countPatientsToday() {
        LocalDateTime startOfDay = LocalDateTime.now().toLocalDate().atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);
        return patientRepository.countByCreatedAtBetween(startOfDay, endOfDay);
    }

    private String generatePatientNo() {
        long count = patientRepository.count() + 1 + counter.incrementAndGet();
        return "PT-" + Year.now().getValue() + "-" + String.format("%06d", count);
    }

    private void mapDtoToEntity(PatientDTO dto, Patient patient) {
        patient.setFullName(dto.getFullName());
        patient.setGender(dto.getGender());
        patient.setDateOfBirth(dto.getDateOfBirth());
        patient.setPhone(dto.getPhone());
        patient.setEmail(dto.getEmail());
        patient.setIdNumber(dto.getIdNumber());
        patient.setAddress(dto.getAddress());
        patient.setNextOfKinName(dto.getNextOfKinName());
        patient.setNextOfKinPhone(dto.getNextOfKinPhone());
        patient.setNextOfKinRelationship(dto.getNextOfKinRelationship());
        patient.setAllergies(dto.getAllergies());
        patient.setBloodGroup(dto.getBloodGroup());
        patient.setInsuranceMemberNumber(dto.getInsuranceMemberNumber());

        if (dto.getInsuranceCompanyId() != null) {
            InsuranceCompany ic = insuranceCompanyRepository.findById(dto.getInsuranceCompanyId())
                    .orElseThrow(() -> new ResourceNotFoundException("Insurance Company", dto.getInsuranceCompanyId()));
            patient.setInsuranceCompany(ic);
        }
    }

    public PatientDTO mapEntityToDto(Patient p) {
        PatientDTO dto = new PatientDTO();
        dto.setId(p.getId());
        dto.setPatientNo(p.getPatientNo());
        dto.setFullName(p.getFullName());
        dto.setGender(p.getGender());
        dto.setDateOfBirth(p.getDateOfBirth());
        dto.setPhone(p.getPhone());
        dto.setEmail(p.getEmail());
        dto.setIdNumber(p.getIdNumber());
        dto.setAddress(p.getAddress());
        dto.setNextOfKinName(p.getNextOfKinName());
        dto.setNextOfKinPhone(p.getNextOfKinPhone());
        dto.setNextOfKinRelationship(p.getNextOfKinRelationship());
        dto.setAllergies(p.getAllergies());
        dto.setBloodGroup(p.getBloodGroup());
        dto.setInsuranceMemberNumber(p.getInsuranceMemberNumber());
        if (p.getDateOfBirth() != null) {
            dto.setAge(Period.between(p.getDateOfBirth(), LocalDate.now()).getYears());
        }
        if (p.getInsuranceCompany() != null) {
            dto.setInsuranceCompanyId(p.getInsuranceCompany().getId());
            dto.setInsuranceCompanyName(p.getInsuranceCompany().getName());
        }
        return dto;
    }
}
