package com.helvinotech.hms.service;

import com.helvinotech.hms.dto.ImagingOrderDTO;
import com.helvinotech.hms.entity.ImagingOrder;
import com.helvinotech.hms.entity.User;
import com.helvinotech.hms.entity.Visit;
import com.helvinotech.hms.enums.LabOrderStatus;
import com.helvinotech.hms.exception.ResourceNotFoundException;
import com.helvinotech.hms.repository.ImagingOrderRepository;
import com.helvinotech.hms.repository.UserRepository;
import com.helvinotech.hms.repository.VisitRepository;
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
public class ImagingService {

    private final ImagingOrderRepository imagingOrderRepository;
    private final VisitRepository visitRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = false)
    public ImagingOrderDTO createOrder(ImagingOrderDTO dto) {
        Visit visit = visitRepository.findById(dto.getVisitId())
                .orElseThrow(() -> new ResourceNotFoundException("Visit", dto.getVisitId()));
        ImagingOrder order = ImagingOrder.builder()
                .visit(visit)
                .imagingType(dto.getImagingType())
                .bodyPart(dto.getBodyPart())
                .clinicalIndication(dto.getClinicalIndication())
                .price(dto.getPrice())
                .build();
        return mapToDto(imagingOrderRepository.save(order));
    }

    public List<ImagingOrderDTO> getOrdersByVisit(Long visitId) {
        return imagingOrderRepository.findByVisitId(visitId).stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public Page<ImagingOrderDTO> getOrdersByStatus(LabOrderStatus status, Pageable pageable) {
        return imagingOrderRepository.findByStatus(status, pageable).map(this::mapToDto);
    }

    @Transactional(readOnly = false)
    public ImagingOrderDTO completeOrder(Long id, String findings, String impression, Long radiologistId) {
        ImagingOrder order = imagingOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Imaging Order", id));
        User radiologist = userRepository.findById(radiologistId)
                .orElseThrow(() -> new ResourceNotFoundException("User", radiologistId));
        order.setFindings(findings);
        order.setImpression(impression);
        order.setRadiologist(radiologist);
        order.setCompletedAt(LocalDateTime.now());
        order.setStatus(LabOrderStatus.COMPLETED);
        return mapToDto(imagingOrderRepository.save(order));
    }

    public Page<ImagingOrderDTO> getAllOrders(Pageable pageable) {
        return imagingOrderRepository.findAll(pageable).map(this::mapToDto);
    }

    private ImagingOrderDTO mapToDto(ImagingOrder o) {
        ImagingOrderDTO dto = new ImagingOrderDTO();
        dto.setId(o.getId());
        dto.setVisitId(o.getVisit().getId());
        dto.setImagingType(o.getImagingType());
        dto.setBodyPart(o.getBodyPart());
        dto.setClinicalIndication(o.getClinicalIndication());
        dto.setStatus(o.getStatus());
        dto.setFindings(o.getFindings());
        dto.setImpression(o.getImpression());
        dto.setPrice(o.getPrice());
        if (o.getRadiologist() != null) dto.setRadiologistName(o.getRadiologist().getFullName());
        dto.setCompletedAt(o.getCompletedAt());
        dto.setCreatedAt(o.getCreatedAt());
        return dto;
    }
}
