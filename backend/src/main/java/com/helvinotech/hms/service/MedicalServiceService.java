package com.helvinotech.hms.service;

import com.helvinotech.hms.dto.MedicalServiceDTO;
import com.helvinotech.hms.entity.MedicalService;
import com.helvinotech.hms.enums.PaymentStatus;
import com.helvinotech.hms.exception.ResourceNotFoundException;
import com.helvinotech.hms.repository.BillingItemRepository;
import com.helvinotech.hms.repository.BillingRepository;
import com.helvinotech.hms.repository.MedicalServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MedicalServiceService {

    private final MedicalServiceRepository repository;
    private final BillingItemRepository billingItemRepository;
    private final BillingRepository billingRepository;

    public List<MedicalServiceDTO> getAll() {
        return repository.findAllByOrderByCategory().stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<MedicalServiceDTO> getActive() {
        return repository.findByActiveTrueOrderByCategory().stream().map(this::toDto).collect(Collectors.toList());
    }

    public MedicalServiceDTO getById(Long id) {
        return toDto(repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MedicalService", id)));
    }

    @Transactional
    public MedicalServiceDTO create(MedicalServiceDTO dto) {
        MedicalService svc = MedicalService.builder()
                .serviceName(dto.getServiceName())
                .category(dto.getCategory())
                .price(dto.getPrice())
                .description(dto.getDescription())
                .active(true)
                .build();
        return toDto(repository.save(svc));
    }

    @Transactional
    public MedicalServiceDTO update(Long id, MedicalServiceDTO dto) {
        MedicalService svc = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MedicalService", id));
        BigDecimal oldPrice = svc.getPrice();
        svc.setServiceName(dto.getServiceName());
        svc.setCategory(dto.getCategory());
        svc.setPrice(dto.getPrice());
        svc.setDescription(dto.getDescription());
        svc.setActive(dto.isActive());
        MedicalServiceDTO result = toDto(repository.save(svc));

        // Cascade price change to unpaid billing items that reference this service
        if (dto.getPrice() != null && !dto.getPrice().equals(oldPrice)) {
            List<PaymentStatus> unpaid = List.of(PaymentStatus.PENDING, PaymentStatus.PARTIAL);
            billingItemRepository.findByServiceIdAndBillingStatusIn(id, unpaid).forEach(item -> {
                item.setUnitPrice(dto.getPrice());
                item.setTotalPrice(dto.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
                billingItemRepository.save(item);
                recalculateBillingTotal(item.getBilling().getId());
            });
        }
        return result;
    }

    private void recalculateBillingTotal(Long billingId) {
        billingRepository.findById(billingId).ifPresent(billing -> {
            BigDecimal total = billingItemRepository.findByBillingId(billingId).stream()
                    .map(i -> i.getTotalPrice() != null ? i.getTotalPrice() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            billing.setTotalAmount(total);
            billingRepository.save(billing);
        });
    }

    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("MedicalService", id);
        }
        repository.deleteById(id);
    }

    private MedicalServiceDTO toDto(MedicalService s) {
        MedicalServiceDTO dto = new MedicalServiceDTO();
        dto.setId(s.getId());
        dto.setServiceName(s.getServiceName());
        dto.setCategory(s.getCategory());
        dto.setPrice(s.getPrice());
        dto.setDescription(s.getDescription());
        dto.setActive(s.isActive());
        dto.setCreatedAt(s.getCreatedAt());
        return dto;
    }
}
