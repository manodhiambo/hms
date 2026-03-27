package com.helvinotech.hms.service;

import com.helvinotech.hms.dto.LabOrderDTO;
import com.helvinotech.hms.dto.LabTestDTO;
import com.helvinotech.hms.entity.*;
import com.helvinotech.hms.enums.LabOrderStatus;
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
public class LabService {

    private final LabTestRepository labTestRepository;
    private final LabOrderRepository labOrderRepository;
    private final VisitRepository visitRepository;
    private final UserRepository userRepository;

    // Lab Test CRUD
    @Transactional(readOnly = false)
    public LabTestDTO createTest(LabTestDTO dto) {
        LabTest test = new LabTest();
        mapTestDtoToEntity(dto, test);
        test.setActive(true);
        return mapTestToDto(labTestRepository.save(test));
    }

    public List<LabTestDTO> getAllTests() {
        return labTestRepository.findByActiveTrue().stream().map(this::mapTestToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = false)
    public LabTestDTO updateTest(Long id, LabTestDTO dto) {
        LabTest test = labTestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lab Test", id));
        mapTestDtoToEntity(dto, test);
        return mapTestToDto(labTestRepository.save(test));
    }

    // Lab Orders
    @Transactional(readOnly = false)
    public LabOrderDTO createOrder(Long visitId, Long testId, Long orderedById) {
        Visit visit = visitRepository.findById(visitId)
                .orElseThrow(() -> new ResourceNotFoundException("Visit", visitId));
        LabTest test = labTestRepository.findById(testId)
                .orElseThrow(() -> new ResourceNotFoundException("Lab Test", testId));
        User orderedBy = userRepository.findById(orderedById)
                .orElseThrow(() -> new ResourceNotFoundException("User", orderedById));

        LabOrder order = LabOrder.builder()
                .visit(visit).test(test).orderedBy(orderedBy).build();
        return mapOrderToDto(labOrderRepository.save(order));
    }

    public List<LabOrderDTO> getOrdersByVisit(Long visitId) {
        return labOrderRepository.findByVisitId(visitId).stream().map(this::mapOrderToDto).collect(Collectors.toList());
    }

    public Page<LabOrderDTO> getOrdersByStatus(LabOrderStatus status, Pageable pageable) {
        return labOrderRepository.findByStatus(status, pageable).map(this::mapOrderToDto);
    }

    public Page<LabOrderDTO> searchOrdersByStatus(LabOrderStatus status, String q, Pageable pageable) {
        return labOrderRepository.findByStatusAndPatientSearch(status, q, pageable).map(this::mapOrderToDto);
    }

    @Transactional(readOnly = false)
    public LabOrderDTO collectSample(Long orderId) {
        LabOrder order = labOrderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Lab Order", orderId));
        order.setStatus(LabOrderStatus.SAMPLE_COLLECTED);
        order.setSampleCollectedAt(LocalDateTime.now());
        return mapOrderToDto(labOrderRepository.save(order));
    }

    @Transactional(readOnly = false)
    public LabOrderDTO processResult(Long orderId, String result, boolean abnormal, String remarks, Long processedById) {
        LabOrder order = labOrderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Lab Order", orderId));
        User processedBy = userRepository.findById(processedById)
                .orElseThrow(() -> new ResourceNotFoundException("User", processedById));
        order.setResult(result);
        order.setAbnormal(abnormal);
        order.setRemarks(remarks);
        order.setProcessedBy(processedBy);
        order.setProcessedAt(LocalDateTime.now());
        order.setStatus(LabOrderStatus.COMPLETED);
        return mapOrderToDto(labOrderRepository.save(order));
    }

    @Transactional(readOnly = false)
    public LabOrderDTO verifyResult(Long orderId, Long verifiedById) {
        LabOrder order = labOrderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Lab Order", orderId));
        User verifiedBy = userRepository.findById(verifiedById)
                .orElseThrow(() -> new ResourceNotFoundException("User", verifiedById));
        order.setVerifiedBy(verifiedBy);
        order.setVerifiedAt(LocalDateTime.now());
        order.setStatus(LabOrderStatus.VERIFIED);
        return mapOrderToDto(labOrderRepository.save(order));
    }

    @Transactional(readOnly = false)
    public LabOrderDTO releaseResult(Long orderId) {
        LabOrder order = labOrderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Lab Order", orderId));
        order.setReleasedAt(LocalDateTime.now());
        order.setStatus(LabOrderStatus.RELEASED);
        LabOrder saved = labOrderRepository.save(order);
        // Automatically mark visit as PENDING_LAB_REVIEW so it appears in the review queue
        Visit visit = saved.getVisit();
        if (visit != null && !visit.isCompleted()
                && visit.getTriageStatus() != TriageStatus.PENDING_LAB_REVIEW
                && visit.getTriageStatus() != TriageStatus.COMPLETED) {
            visit.setTriageStatus(TriageStatus.PENDING_LAB_REVIEW);
            visitRepository.save(visit);
        }
        return mapOrderToDto(saved);
    }

    public long countPendingOrders() {
        return labOrderRepository.countByStatus(LabOrderStatus.ORDERED) +
               labOrderRepository.countByStatus(LabOrderStatus.SAMPLE_COLLECTED) +
               labOrderRepository.countByStatus(LabOrderStatus.PROCESSING);
    }

    private void mapTestDtoToEntity(LabTestDTO dto, LabTest t) {
        t.setTestName(dto.getTestName());
        t.setTestCode(dto.getTestCode());
        t.setCategory(dto.getCategory());
        t.setSampleType(dto.getSampleType());
        t.setPrice(dto.getPrice());
        t.setReferenceRange(dto.getReferenceRange());
        t.setUnit(dto.getUnit());
        t.setTurnaroundTimeHours(dto.getTurnaroundTimeHours());
        t.setActive(dto.isActive());
    }

    private LabTestDTO mapTestToDto(LabTest t) {
        LabTestDTO dto = new LabTestDTO();
        dto.setId(t.getId());
        dto.setTestName(t.getTestName());
        dto.setTestCode(t.getTestCode());
        dto.setCategory(t.getCategory());
        dto.setSampleType(t.getSampleType());
        dto.setPrice(t.getPrice());
        dto.setReferenceRange(t.getReferenceRange());
        dto.setUnit(t.getUnit());
        dto.setTurnaroundTimeHours(t.getTurnaroundTimeHours());
        dto.setActive(t.isActive());
        return dto;
    }

    private LabOrderDTO mapOrderToDto(LabOrder o) {
        LabOrderDTO dto = new LabOrderDTO();
        dto.setId(o.getId());
        dto.setVisitId(o.getVisit().getId());
        if (o.getVisit().getPatient() != null) {
            dto.setPatientName(o.getVisit().getPatient().getFullName());
            dto.setPatientNo(o.getVisit().getPatient().getPatientNo());
        }
        dto.setTestId(o.getTest().getId());
        dto.setTestName(o.getTest().getTestName());
        dto.setTestCode(o.getTest().getTestCode());
        dto.setCategory(o.getTest().getCategory());
        if (o.getOrderedBy() != null) {
            dto.setOrderedById(o.getOrderedBy().getId());
            dto.setOrderedByName(o.getOrderedBy().getFullName());
        }
        dto.setStatus(o.getStatus());
        dto.setResult(o.getResult());
        dto.setAbnormal(o.isAbnormal());
        dto.setRemarks(o.getRemarks());
        if (o.getProcessedBy() != null) dto.setProcessedByName(o.getProcessedBy().getFullName());
        if (o.getVerifiedBy() != null) dto.setVerifiedByName(o.getVerifiedBy().getFullName());
        dto.setSampleCollectedAt(o.getSampleCollectedAt());
        dto.setProcessedAt(o.getProcessedAt());
        dto.setVerifiedAt(o.getVerifiedAt());
        dto.setReleasedAt(o.getReleasedAt());
        dto.setCreatedAt(o.getCreatedAt());
        return dto;
    }
}
