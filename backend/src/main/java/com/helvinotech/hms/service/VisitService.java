package com.helvinotech.hms.service;

import com.helvinotech.hms.dto.*;
import com.helvinotech.hms.entity.*;
import com.helvinotech.hms.enums.LabOrderStatus;
import com.helvinotech.hms.enums.TriagePriority;
import com.helvinotech.hms.enums.TriageStatus;
import com.helvinotech.hms.exception.ResourceNotFoundException;
import com.helvinotech.hms.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class VisitService {

    private final VisitRepository visitRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = false)
    public VisitDTO createVisit(VisitDTO dto) {
        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient", dto.getPatientId()));
        Visit visit = new Visit();
        visit.setPatient(patient);
        visit.setVisitType(dto.getVisitType());
        visit.setChiefComplaint(dto.getChiefComplaint());
        if (dto.getDoctorId() != null) {
            User doctor = userRepository.findById(dto.getDoctorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Doctor", dto.getDoctorId()));
            visit.setDoctor(doctor);
        }
        visit = visitRepository.save(visit);
        return mapToDto(visit);
    }

    public VisitDTO getVisit(Long id) {
        Visit visit = visitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Visit", id));
        return mapToDto(visit);
    }

    public Page<VisitDTO> getVisitsByPatient(Long patientId, Pageable pageable) {
        return visitRepository.findByPatientIdOrderByCreatedAtDesc(patientId, pageable).map(this::mapToDto);
    }

    public List<VisitDTO> getDoctorQueue(Long doctorId) {
        return visitRepository.findByDoctorIdAndCompletedFalseOrderByCreatedAtAsc(doctorId)
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = false)
    public VisitDTO updateVisit(Long id, VisitDTO dto) {
        Visit visit = visitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Visit", id));
        if (dto.getDoctorId() != null) {
            User doctor = userRepository.findById(dto.getDoctorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Doctor", dto.getDoctorId()));
            visit.setDoctor(doctor);
        }
        visit.setChiefComplaint(dto.getChiefComplaint());
        visit.setPresentingIllness(dto.getPresentingIllness());
        visit.setExamination(dto.getExamination());
        visit.setDiagnosis(dto.getDiagnosis());
        visit.setDiagnosisCode(dto.getDiagnosisCode());
        visit.setTreatmentPlan(dto.getTreatmentPlan());
        visit.setDoctorNotes(dto.getDoctorNotes());
        visit.setBloodPressure(dto.getBloodPressure());
        visit.setTemperature(dto.getTemperature());
        visit.setPulseRate(dto.getPulseRate());
        visit.setRespiratoryRate(dto.getRespiratoryRate());
        visit.setWeight(dto.getWeight());
        visit.setHeight(dto.getHeight());
        visit.setOxygenSaturation(dto.getOxygenSaturation());
        visit = visitRepository.save(visit);
        return mapToDto(visit);
    }

    @Transactional(readOnly = false)
    public VisitDTO completeVisit(Long id) {
        Visit visit = visitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Visit", id));
        visit.setCompleted(true);
        visit.setTriageStatus(TriageStatus.COMPLETED);
        visit = visitRepository.save(visit);
        return mapToDto(visit);
    }

    @Transactional(readOnly = false)
    public VisitDTO updateTriage(Long id, VisitDTO dto) {
        Visit visit = visitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Visit", id));
        if (dto.getTriagePriority() != null) {
            visit.setTriagePriority(dto.getTriagePriority());
        }
        if (dto.getTriageStatus() != null) {
            visit.setTriageStatus(dto.getTriageStatus());
        }
        if (dto.getTriageNotes() != null) {
            visit.setTriageNotes(dto.getTriageNotes());
        }
        // Record vitals if provided during triage
        if (dto.getBloodPressure() != null) visit.setBloodPressure(dto.getBloodPressure());
        if (dto.getTemperature() != null) visit.setTemperature(dto.getTemperature());
        if (dto.getPulseRate() != null) visit.setPulseRate(dto.getPulseRate());
        if (dto.getRespiratoryRate() != null) visit.setRespiratoryRate(dto.getRespiratoryRate());
        if (dto.getWeight() != null) visit.setWeight(dto.getWeight());
        if (dto.getHeight() != null) visit.setHeight(dto.getHeight());
        if (dto.getOxygenSaturation() != null) visit.setOxygenSaturation(dto.getOxygenSaturation());
        if (dto.getTriagedById() != null) {
            User nurse = userRepository.findById(dto.getTriagedById())
                    .orElseThrow(() -> new ResourceNotFoundException("User", dto.getTriagedById()));
            visit.setTriagedBy(nurse);
        }
        visit.setTriagedAt(LocalDateTime.now());
        visit = visitRepository.save(visit);
        return mapToDto(visit);
    }

    public List<VisitDTO> getTriageQueue() {
        return visitRepository.findByTriageStatusInAndCompletedFalseOrderByCreatedAtAsc(
                List.of(TriageStatus.WAITING, TriageStatus.TRIAGED, TriageStatus.IN_CONSULTATION, TriageStatus.PENDING_LAB_REVIEW))
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public List<VisitDTO> getLabReviewQueue() {
        return visitRepository.findVisitsWithReleasedLabResults(LabOrderStatus.RELEASED, TriageStatus.PENDING_LAB_REVIEW)
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public long countVisitsToday() {
        LocalDateTime startOfDay = LocalDateTime.now().toLocalDate().atStartOfDay();
        return visitRepository.countByCreatedAtBetween(startOfDay, startOfDay.plusDays(1));
    }

    public Page<VisitDTO> getAllVisits(Pageable pageable) {
        return visitRepository.findAll(pageable).map(this::mapToDto);
    }

    public Page<VisitDTO> searchVisits(String q, Pageable pageable) {
        return visitRepository.searchVisits(q, pageable).map(this::mapToDto);
    }

    private VisitDTO mapToDto(Visit v) {
        VisitDTO dto = new VisitDTO();
        dto.setId(v.getId());
        dto.setPatientId(v.getPatient().getId());
        dto.setPatientName(v.getPatient().getFullName());
        dto.setPatientNo(v.getPatient().getPatientNo());
        if (v.getDoctor() != null) {
            dto.setDoctorId(v.getDoctor().getId());
            dto.setDoctorName(v.getDoctor().getFullName());
        }
        dto.setVisitType(v.getVisitType());
        dto.setChiefComplaint(v.getChiefComplaint());
        dto.setPresentingIllness(v.getPresentingIllness());
        dto.setExamination(v.getExamination());
        dto.setDiagnosis(v.getDiagnosis());
        dto.setDiagnosisCode(v.getDiagnosisCode());
        dto.setTreatmentPlan(v.getTreatmentPlan());
        dto.setDoctorNotes(v.getDoctorNotes());
        dto.setBloodPressure(v.getBloodPressure());
        dto.setTemperature(v.getTemperature());
        dto.setPulseRate(v.getPulseRate());
        dto.setRespiratoryRate(v.getRespiratoryRate());
        dto.setWeight(v.getWeight());
        dto.setHeight(v.getHeight());
        dto.setOxygenSaturation(v.getOxygenSaturation());
        dto.setTriageStatus(v.getTriageStatus());
        dto.setTriagePriority(v.getTriagePriority());
        dto.setTriageNotes(v.getTriageNotes());
        dto.setTriagedAt(v.getTriagedAt());
        if (v.getTriagedBy() != null) {
            dto.setTriagedById(v.getTriagedBy().getId());
            dto.setTriagedByName(v.getTriagedBy().getFullName());
        }
        dto.setCompleted(v.isCompleted());
        dto.setCreatedAt(v.getCreatedAt());
        // Map prescriptions, lab orders, imaging orders
        if (v.getPrescriptions() != null) {
            dto.setPrescriptions(v.getPrescriptions().stream().map(rx -> {
                PrescriptionDTO p = new PrescriptionDTO();
                p.setId(rx.getId());
                p.setVisitId(v.getId());
                if (rx.getDrug() != null) {
                    p.setDrugId(rx.getDrug().getId());
                    p.setDrugName(rx.getDrug().getGenericName() + (rx.getDrug().getBrandName() != null ? " (" + rx.getDrug().getBrandName() + ")" : ""));
                }
                p.setDosage(rx.getDosage());
                p.setFrequency(rx.getFrequency());
                p.setDuration(rx.getDuration());
                p.setQuantityPrescribed(rx.getQuantityPrescribed());
                p.setQuantityDispensed(rx.getQuantityDispensed());
                p.setInstructions(rx.getInstructions());
                p.setDispensed(rx.isDispensed());
                if (rx.getDispensedBy() != null) p.setDispensedByName(rx.getDispensedBy().getFullName());
                p.setDispensedAt(rx.getDispensedAt());
                p.setCreatedAt(rx.getCreatedAt());
                return p;
            }).collect(Collectors.toList()));
        }
        if (v.getLabOrders() != null) {
            dto.setLabOrders(v.getLabOrders().stream().map(lo -> {
                LabOrderDTO l = new LabOrderDTO();
                l.setId(lo.getId());
                l.setVisitId(v.getId());
                if (lo.getTest() != null) {
                    l.setTestId(lo.getTest().getId());
                    l.setTestName(lo.getTest().getTestName());
                    l.setTestCode(lo.getTest().getTestCode());
                    l.setCategory(lo.getTest().getCategory());
                }
                if (lo.getOrderedBy() != null) {
                    l.setOrderedById(lo.getOrderedBy().getId());
                    l.setOrderedByName(lo.getOrderedBy().getFullName());
                }
                l.setStatus(lo.getStatus());
                l.setResult(lo.getResult());
                l.setAbnormal(lo.isAbnormal());
                l.setRemarks(lo.getRemarks());
                if (lo.getProcessedBy() != null) l.setProcessedByName(lo.getProcessedBy().getFullName());
                if (lo.getVerifiedBy() != null) l.setVerifiedByName(lo.getVerifiedBy().getFullName());
                l.setSampleCollectedAt(lo.getSampleCollectedAt());
                l.setProcessedAt(lo.getProcessedAt());
                l.setVerifiedAt(lo.getVerifiedAt());
                l.setReleasedAt(lo.getReleasedAt());
                l.setCreatedAt(lo.getCreatedAt());
                return l;
            }).collect(Collectors.toList()));
        }
        if (v.getImagingOrders() != null) {
            dto.setImagingOrders(v.getImagingOrders().stream().map(io -> {
                ImagingOrderDTO im = new ImagingOrderDTO();
                im.setId(io.getId());
                im.setVisitId(v.getId());
                im.setImagingType(io.getImagingType());
                im.setBodyPart(io.getBodyPart());
                im.setClinicalIndication(io.getClinicalIndication());
                im.setStatus(io.getStatus());
                im.setFindings(io.getFindings());
                im.setImpression(io.getImpression());
                im.setPrice(io.getPrice());
                if (io.getRadiologist() != null) im.setRadiologistName(io.getRadiologist().getFullName());
                im.setCompletedAt(io.getCompletedAt());
                im.setCreatedAt(io.getCreatedAt());
                return im;
            }).collect(Collectors.toList()));
        }
        return dto;
    }
}
