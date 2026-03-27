package com.helvinotech.hms.service;

import com.helvinotech.hms.dto.RefundDTO;
import com.helvinotech.hms.entity.Drug;
import com.helvinotech.hms.entity.Prescription;
import com.helvinotech.hms.entity.Refund;
import com.helvinotech.hms.entity.User;
import com.helvinotech.hms.enums.PaymentMethod;
import com.helvinotech.hms.enums.RefundStatus;
import com.helvinotech.hms.exception.BadRequestException;
import com.helvinotech.hms.exception.ResourceNotFoundException;
import com.helvinotech.hms.repository.DrugRepository;
import com.helvinotech.hms.repository.PrescriptionRepository;
import com.helvinotech.hms.repository.RefundRepository;
import com.helvinotech.hms.repository.UserRepository;
import com.helvinotech.hms.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RefundService {

    private final RefundRepository refundRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final DrugRepository drugRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = false)
    public RefundDTO createRefund(RefundDTO dto) {
        Prescription rx = prescriptionRepository.findById(dto.getPrescriptionId())
                .orElseThrow(() -> new ResourceNotFoundException("Prescription", dto.getPrescriptionId()));

        if (!rx.isDispensed()) {
            throw new BadRequestException("Cannot refund a prescription that has not been dispensed.");
        }
        if (refundRepository.existsByPrescriptionIdAndStatusNot(rx.getId(), RefundStatus.REJECTED)) {
            throw new BadRequestException("A refund already exists for this prescription.");
        }
        if (dto.getQuantityReturned() == null || dto.getQuantityReturned() <= 0) {
            throw new BadRequestException("Quantity returned must be greater than zero.");
        }
        int dispensed = rx.getQuantityDispensed() != null ? rx.getQuantityDispensed() : 0;
        if (dto.getQuantityReturned() > dispensed) {
            throw new BadRequestException("Cannot return more than the dispensed quantity (" + dispensed + ").");
        }

        BigDecimal unitPrice = rx.getDrug().getSellingPrice();
        BigDecimal refundAmount = unitPrice.multiply(BigDecimal.valueOf(dto.getQuantityReturned()));

        String refundNumber = "REF-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

        Long hospitalId = TenantContext.getCurrentHospitalId();
        Refund refund = Refund.builder()
                .refundNumber(refundNumber)
                .prescription(rx)
                .patient(rx.getVisit().getPatient())
                .quantityReturned(dto.getQuantityReturned())
                .refundAmount(refundAmount)
                .reason(dto.getReason())
                .notes(dto.getNotes())
                .status(RefundStatus.PENDING)
                .hospitalId(hospitalId)
                .build();

        return mapToDto(refundRepository.save(refund));
    }

    @Transactional(readOnly = false)
    public RefundDTO approveRefund(Long id, Long processedById, String refundMethod, String referenceNumber) {
        Refund refund = getRefundEntity(id);
        if (refund.getStatus() != RefundStatus.PENDING) {
            throw new BadRequestException("Only PENDING refunds can be approved.");
        }
        User processor = userRepository.findById(processedById)
                .orElseThrow(() -> new ResourceNotFoundException("User", processedById));

        // Return stock
        Drug drug = refund.getPrescription().getDrug();
        drug.setQuantityInStock(drug.getQuantityInStock() + refund.getQuantityReturned());
        drugRepository.save(drug);

        refund.setStatus(RefundStatus.PROCESSED);
        refund.setProcessedBy(processor);
        refund.setProcessedAt(LocalDateTime.now());
        if (refundMethod != null) refund.setRefundMethod(PaymentMethod.valueOf(refundMethod));
        refund.setReferenceNumber(referenceNumber);

        return mapToDto(refundRepository.save(refund));
    }

    @Transactional(readOnly = false)
    public RefundDTO rejectRefund(Long id, Long processedById, String notes) {
        Refund refund = getRefundEntity(id);
        if (refund.getStatus() != RefundStatus.PENDING) {
            throw new BadRequestException("Only PENDING refunds can be rejected.");
        }
        User processor = userRepository.findById(processedById)
                .orElseThrow(() -> new ResourceNotFoundException("User", processedById));

        refund.setStatus(RefundStatus.REJECTED);
        refund.setProcessedBy(processor);
        refund.setProcessedAt(LocalDateTime.now());
        if (notes != null) refund.setNotes(notes);

        return mapToDto(refundRepository.save(refund));
    }

    public Page<RefundDTO> getAllRefunds(Pageable pageable) {
        Long hospitalId = TenantContext.getCurrentHospitalId();
        if (hospitalId != null) {
            return refundRepository.findByHospitalIdOrderByCreatedAtDesc(hospitalId, pageable).map(this::mapToDto);
        }
        return refundRepository.findAllByOrderByCreatedAtDesc(pageable).map(this::mapToDto);
    }

    public Page<RefundDTO> getRefundsByStatus(RefundStatus status, Pageable pageable) {
        Long hospitalId = TenantContext.getCurrentHospitalId();
        if (hospitalId != null) {
            return refundRepository.findByHospitalIdAndStatusOrderByCreatedAtDesc(hospitalId, status, pageable).map(this::mapToDto);
        }
        return refundRepository.findByStatusOrderByCreatedAtDesc(status, pageable).map(this::mapToDto);
    }

    public List<RefundDTO> getRefundsByPatient(Long patientId) {
        Long hospitalId = TenantContext.getCurrentHospitalId();
        if (hospitalId != null) {
            return refundRepository.findByHospitalIdAndPatientIdOrderByCreatedAtDesc(hospitalId, patientId)
                    .stream().map(this::mapToDto).collect(Collectors.toList());
        }
        return refundRepository.findByPatientIdOrderByCreatedAtDesc(patientId)
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public RefundDTO getRefund(Long id) {
        return mapToDto(getRefundEntity(id));
    }

    private Refund getRefundEntity(Long id) {
        return refundRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Refund", id));
    }

    private RefundDTO mapToDto(Refund r) {
        RefundDTO dto = new RefundDTO();
        dto.setId(r.getId());
        dto.setRefundNumber(r.getRefundNumber());
        dto.setPrescriptionId(r.getPrescription().getId());
        dto.setDrugName(r.getPrescription().getDrug().getGenericName()
                + " (" + r.getPrescription().getDrug().getBrandName() + ")");
        dto.setDosage(r.getPrescription().getDosage());
        dto.setQuantityDispensed(r.getPrescription().getQuantityDispensed());
        dto.setPatientId(r.getPatient().getId());
        dto.setPatientName(r.getPatient().getFullName());
        dto.setPatientNo(r.getPatient().getPatientNo());
        dto.setQuantityReturned(r.getQuantityReturned());
        dto.setRefundAmount(r.getRefundAmount());
        dto.setReason(r.getReason());
        dto.setNotes(r.getNotes());
        dto.setStatus(r.getStatus());
        dto.setRefundMethod(r.getRefundMethod());
        dto.setReferenceNumber(r.getReferenceNumber());
        if (r.getRequestedBy() != null) dto.setRequestedByName(r.getRequestedBy().getFullName());
        if (r.getProcessedBy() != null) dto.setProcessedByName(r.getProcessedBy().getFullName());
        dto.setProcessedAt(r.getProcessedAt());
        dto.setCreatedAt(r.getCreatedAt());
        return dto;
    }
}
