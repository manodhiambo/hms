package com.helvinotech.hms.service;

import com.helvinotech.hms.dto.PatientDTO;
import com.helvinotech.hms.entity.InsuranceCompany;
import com.helvinotech.hms.entity.Patient;
import com.helvinotech.hms.exception.ResourceNotFoundException;
import com.helvinotech.hms.repository.InsuranceCompanyRepository;
import com.helvinotech.hms.repository.PatientRepository;
import com.helvinotech.hms.tenant.TenantContext;
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
        Long hospitalId = TenantContext.getCurrentHospitalId();

        // Determine if minor (< 18 years)
        boolean isMinor = dto.getDateOfBirth() != null &&
                Period.between(dto.getDateOfBirth(), LocalDate.now()).getYears() < 18;
        // Phone required for adult patients
        if (!isMinor && (dto.getPhone() == null || dto.getPhone().isBlank())) {
            throw new IllegalArgumentException("Phone number is required for adult patients");
        }
        // Duplicate detection by phone (within hospital)
        if (dto.getPhone() != null && !dto.getPhone().isBlank()) {
            if (hospitalId != null) {
                patientRepository.findByPhoneAndHospitalId(dto.getPhone().trim(), hospitalId).ifPresent(existing -> {
                    throw new IllegalStateException("DUPLICATE_PHONE:" + existing.getPatientNo() + ":" + existing.getFullName());
                });
            } else {
                patientRepository.findByPhone(dto.getPhone().trim()).ifPresent(existing -> {
                    throw new IllegalStateException("DUPLICATE_PHONE:" + existing.getPatientNo() + ":" + existing.getFullName());
                });
            }
        }
        // Duplicate detection by national ID (within hospital)
        if (dto.getIdNumber() != null && !dto.getIdNumber().isBlank()) {
            if (hospitalId != null) {
                patientRepository.findByIdNumberAndHospitalId(dto.getIdNumber().trim(), hospitalId).ifPresent(existing -> {
                    throw new IllegalStateException("DUPLICATE_ID:" + existing.getPatientNo() + ":" + existing.getFullName());
                });
            } else {
                patientRepository.findByIdNumber(dto.getIdNumber().trim()).ifPresent(existing -> {
                    throw new IllegalStateException("DUPLICATE_ID:" + existing.getPatientNo() + ":" + existing.getFullName());
                });
            }
        }
        Patient patient = new Patient();
        patient.setPatientNo(generatePatientNo(hospitalId));
        patient.setHospitalId(hospitalId);
        mapDtoToEntity(dto, patient, hospitalId);
        patient = patientRepository.save(patient);
        return mapEntityToDto(patient);
    }

    public java.util.List<PatientDTO> checkDuplicates(String phone, String idNumber) {
        Long hospitalId = TenantContext.getCurrentHospitalId();
        java.util.List<PatientDTO> matches = new java.util.ArrayList<>();
        if (phone != null && !phone.isBlank()) {
            (hospitalId != null
                    ? patientRepository.findByPhoneAndHospitalId(phone.trim(), hospitalId)
                    : patientRepository.findByPhone(phone.trim()))
                    .map(this::mapEntityToDto).ifPresent(matches::add);
        }
        if (idNumber != null && !idNumber.isBlank()) {
            (hospitalId != null
                    ? patientRepository.findByIdNumberAndHospitalId(idNumber.trim(), hospitalId)
                    : patientRepository.findByIdNumber(idNumber.trim()))
                    .map(this::mapEntityToDto)
                    .filter(p -> matches.stream().noneMatch(m -> m.getId().equals(p.getId())))
                    .ifPresent(matches::add);
        }
        return matches;
    }

    public PatientDTO getPatient(Long id) {
        Long hospitalId = TenantContext.getCurrentHospitalId();
        Patient patient;
        if (hospitalId != null) {
            patient = patientRepository.findByIdAndHospitalId(id, hospitalId)
                    .orElseThrow(() -> new ResourceNotFoundException("Patient", id));
        } else {
            patient = patientRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Patient", id));
        }
        return mapEntityToDto(patient);
    }

    public PatientDTO getPatientByNo(String patientNo) {
        Long hospitalId = TenantContext.getCurrentHospitalId();
        Patient patient;
        if (hospitalId != null) {
            patient = patientRepository.findByPatientNoAndHospitalId(patientNo, hospitalId)
                    .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + patientNo));
        } else {
            patient = patientRepository.findByPatientNo(patientNo)
                    .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + patientNo));
        }
        return mapEntityToDto(patient);
    }

    public Page<PatientDTO> getAllPatients(Pageable pageable) {
        Long hospitalId = TenantContext.getCurrentHospitalId();
        if (hospitalId != null) {
            return patientRepository.findByHospitalId(hospitalId, pageable).map(this::mapEntityToDto);
        }
        return patientRepository.findAll(pageable).map(this::mapEntityToDto);
    }

    public Page<PatientDTO> searchPatients(String query, Pageable pageable) {
        Long hospitalId = TenantContext.getCurrentHospitalId();
        if (hospitalId != null) {
            return patientRepository.searchPatients(query, hospitalId, pageable).map(this::mapEntityToDto);
        }
        return patientRepository.searchPatients(query, pageable).map(this::mapEntityToDto);
    }

    @Transactional(readOnly = false)
    public PatientDTO updatePatient(Long id, PatientDTO dto) {
        Long hospitalId = TenantContext.getCurrentHospitalId();
        Patient patient;
        if (hospitalId != null) {
            patient = patientRepository.findByIdAndHospitalId(id, hospitalId)
                    .orElseThrow(() -> new ResourceNotFoundException("Patient", id));
        } else {
            patient = patientRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Patient", id));
        }
        mapDtoToEntity(dto, patient, hospitalId);
        patient = patientRepository.save(patient);
        return mapEntityToDto(patient);
    }

    public long countPatientsToday() {
        Long hospitalId = TenantContext.getCurrentHospitalId();
        LocalDateTime startOfDay = LocalDateTime.now().toLocalDate().atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);
        if (hospitalId != null) {
            return patientRepository.countByHospitalIdAndCreatedAtBetween(hospitalId, startOfDay, endOfDay);
        }
        return patientRepository.countByCreatedAtBetween(startOfDay, endOfDay);
    }

    private String generatePatientNo(Long hospitalId) {
        long count;
        if (hospitalId != null) {
            count = patientRepository.findByHospitalId(hospitalId,
                    org.springframework.data.domain.Pageable.unpaged()).getTotalElements() + 1 + counter.incrementAndGet();
        } else {
            count = patientRepository.count() + 1 + counter.incrementAndGet();
        }
        return "PT-" + Year.now().getValue() + "-" + String.format("%06d", count);
    }

    private void mapDtoToEntity(PatientDTO dto, Patient patient, Long hospitalId) {
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
