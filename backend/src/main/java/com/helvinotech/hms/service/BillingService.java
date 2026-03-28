package com.helvinotech.hms.service;

import com.helvinotech.hms.dto.*;
import com.helvinotech.hms.entity.*;
import com.helvinotech.hms.enums.PaymentStatus;
import com.helvinotech.hms.exception.ResourceNotFoundException;
import com.helvinotech.hms.repository.*;
import com.helvinotech.hms.tenant.TenantContext;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.time.Year;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BillingService {

    private final BillingRepository billingRepository;
    private final BillingItemRepository billingItemRepository;
    private final PaymentRepository paymentRepository;
    private final PatientRepository patientRepository;
    private final VisitRepository visitRepository;
    private final UserRepository userRepository;
    private final AtomicLong invoiceSequence = new AtomicLong(0);
    private final AtomicLong paymentSequence = new AtomicLong(0);

    @PostConstruct
    public void initSequences() {
        invoiceSequence.set(billingRepository.count());
        paymentSequence.set(paymentRepository.count());
    }

    @Transactional(readOnly = false)
    public BillingDTO createBilling(BillingDTO dto) {
        Long hospitalId = TenantContext.getCurrentHospitalId();
        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient", dto.getPatientId()));
        Billing billing = Billing.builder()
                .invoiceNumber(generateInvoiceNumber())
                .patient(patient)
                .notes(dto.getNotes())
                .billedDate(dto.getBilledDate())
                .hospitalId(hospitalId)
                .build();
        if (dto.getVisitId() != null) {
            Visit visit = visitRepository.findById(dto.getVisitId())
                    .orElseThrow(() -> new ResourceNotFoundException("Visit", dto.getVisitId()));
            billing.setVisit(visit);
        }
        billing = billingRepository.save(billing);
        return mapToDto(billing);
    }

    public BillingDTO getBilling(Long id) {
        Long hospitalId = TenantContext.getCurrentHospitalId();
        if (hospitalId != null) {
            return mapToDto(billingRepository.findByIdAndHospitalId(id, hospitalId)
                    .orElseThrow(() -> new ResourceNotFoundException("Billing", id)));
        }
        return mapToDto(billingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Billing", id)));
    }

    public Page<BillingDTO> getBillingsByPatient(Long patientId, Pageable pageable) {
        Long hospitalId = TenantContext.getCurrentHospitalId();
        if (hospitalId != null) {
            return billingRepository.findByHospitalIdAndPatientIdOrderByCreatedAtDesc(hospitalId, patientId, pageable).map(this::mapToDto);
        }
        return billingRepository.findByPatientIdOrderByCreatedAtDesc(patientId, pageable).map(this::mapToDto);
    }

    public Page<BillingDTO> getBillingsByStatus(PaymentStatus status, Pageable pageable) {
        Long hospitalId = TenantContext.getCurrentHospitalId();
        if (hospitalId != null) {
            return billingRepository.findByHospitalIdAndStatus(hospitalId, status, pageable).map(this::mapToDto);
        }
        return billingRepository.findByStatus(status, pageable).map(this::mapToDto);
    }

    public Page<BillingDTO> getAllBillings(Pageable pageable) {
        Long hospitalId = TenantContext.getCurrentHospitalId();
        if (hospitalId != null) {
            return billingRepository.findByHospitalId(hospitalId, pageable).map(this::mapToDto);
        }
        return billingRepository.findAll(pageable).map(this::mapToDto);
    }

    public Page<BillingDTO> searchBillings(String query, Pageable pageable) {
        Long hospitalId = TenantContext.getCurrentHospitalId();
        if (hospitalId != null) {
            return billingRepository.searchBillings(hospitalId, query, pageable).map(this::mapToDto);
        }
        return billingRepository.searchBillings(query, pageable).map(this::mapToDto);
    }

    @Transactional(readOnly = false)
    public BillingDTO addItem(Long billingId, BillingItemDTO itemDto) {
        Long hospitalId = TenantContext.getCurrentHospitalId();
        Billing billing;
        if (hospitalId != null) {
            billing = billingRepository.findByIdAndHospitalId(billingId, hospitalId)
                    .orElseThrow(() -> new ResourceNotFoundException("Billing", billingId));
        } else {
            billing = billingRepository.findById(billingId)
                    .orElseThrow(() -> new ResourceNotFoundException("Billing", billingId));
        }
        BigDecimal unitPrice = itemDto.getUnitPrice() != null ? itemDto.getUnitPrice() : BigDecimal.ZERO;
        int quantity = itemDto.getQuantity() != null ? itemDto.getQuantity() : 1;
        BillingItem item = BillingItem.builder()
                .billing(billing)
                .serviceType(itemDto.getServiceType())
                .description(itemDto.getDescription())
                .quantity(quantity)
                .unitPrice(unitPrice)
                .totalPrice(unitPrice.multiply(BigDecimal.valueOf(quantity)))
                .serviceId(itemDto.getServiceId())
                .drugId(itemDto.getDrugId())
                .build();
        billingItemRepository.save(item);
        billing.getItems().add(item);
        recalculateTotal(billing);
        updateStatusAfterChange(billing);
        billing = billingRepository.save(billing);
        return mapToDto(billing);
    }

    @Transactional(readOnly = false)
    public BillingDTO updateItem(Long billingId, Long itemId, BillingItemDTO itemDto) {
        Long hospitalId = TenantContext.getCurrentHospitalId();
        Billing billing;
        if (hospitalId != null) {
            billing = billingRepository.findByIdAndHospitalId(billingId, hospitalId)
                    .orElseThrow(() -> new ResourceNotFoundException("Billing", billingId));
        } else {
            billing = billingRepository.findById(billingId)
                    .orElseThrow(() -> new ResourceNotFoundException("Billing", billingId));
        }
        BillingItem item = billingItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("BillingItem", itemId));
        if (!item.getBilling().getId().equals(billingId)) {
            throw new IllegalStateException("Item does not belong to this billing");
        }
        BigDecimal unitPrice = itemDto.getUnitPrice() != null ? itemDto.getUnitPrice() : BigDecimal.ZERO;
        int quantity = itemDto.getQuantity() != null ? itemDto.getQuantity() : 1;
        item.setServiceType(itemDto.getServiceType());
        item.setDescription(itemDto.getDescription());
        item.setQuantity(quantity);
        item.setUnitPrice(unitPrice);
        item.setTotalPrice(unitPrice.multiply(BigDecimal.valueOf(quantity)));
        billingItemRepository.save(item);
        billing = billingRepository.findById(billingId).get();
        recalculateTotal(billing);
        updateStatusAfterChange(billing);
        billing = billingRepository.save(billing);
        return mapToDto(billing);
    }

    @Transactional(readOnly = false)
    public BillingDTO deleteItem(Long billingId, Long itemId) {
        Long hospitalId = TenantContext.getCurrentHospitalId();
        Billing billing;
        if (hospitalId != null) {
            billing = billingRepository.findByIdAndHospitalId(billingId, hospitalId)
                    .orElseThrow(() -> new ResourceNotFoundException("Billing", billingId));
        } else {
            billing = billingRepository.findById(billingId)
                    .orElseThrow(() -> new ResourceNotFoundException("Billing", billingId));
        }
        BillingItem item = billingItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("BillingItem", itemId));
        if (!item.getBilling().getId().equals(billingId)) {
            throw new IllegalStateException("Item does not belong to this billing");
        }
        billing.getItems().remove(item);
        billingItemRepository.delete(item);
        recalculateTotal(billing);
        updateStatusAfterChange(billing);
        billing = billingRepository.save(billing);
        return mapToDto(billing);
    }

    @Transactional(readOnly = false)
    public BillingDTO updateBilling(Long id, BillingDTO dto) {
        Long hospitalId = TenantContext.getCurrentHospitalId();
        Billing billing;
        if (hospitalId != null) {
            billing = billingRepository.findByIdAndHospitalId(id, hospitalId)
                    .orElseThrow(() -> new ResourceNotFoundException("Billing", id));
        } else {
            billing = billingRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Billing", id));
        }
        if (dto.getInsuranceCoveredAmount() != null) {
            billing.setInsuranceCoveredAmount(dto.getInsuranceCoveredAmount());
        }
        if (dto.getNotes() != null) {
            billing.setNotes(dto.getNotes());
        }
        if (dto.getBilledDate() != null) {
            billing.setBilledDate(dto.getBilledDate());
        }
        updateStatusAfterChange(billing);
        billing = billingRepository.save(billing);
        return mapToDto(billing);
    }

    @Transactional(readOnly = false)
    public BillingDTO processPayment(PaymentDTO paymentDto) {
        Long hospitalId = TenantContext.getCurrentHospitalId();
        Billing billing;
        if (hospitalId != null) {
            billing = billingRepository.findByIdAndHospitalId(paymentDto.getBillingId(), hospitalId)
                    .orElseThrow(() -> new ResourceNotFoundException("Billing", paymentDto.getBillingId()));
        } else {
            billing = billingRepository.findById(paymentDto.getBillingId())
                    .orElseThrow(() -> new ResourceNotFoundException("Billing", paymentDto.getBillingId()));
        }
        String receiptNo = "RCP-" + Year.now().getValue() + "-" + String.format("%06d", paymentSequence.incrementAndGet());
        Payment payment = Payment.builder()
                .billing(billing)
                .amount(paymentDto.getAmount())
                .paymentMethod(paymentDto.getPaymentMethod())
                .referenceNumber(paymentDto.getReferenceNumber())
                .receiptNumber(receiptNo)
                .build();
        paymentRepository.save(payment);
        BigDecimal currentPaid = billing.getPaidAmount() != null ? billing.getPaidAmount() : BigDecimal.ZERO;
        BigDecimal newPaid = currentPaid.add(paymentDto.getAmount());
        billing.setPaidAmount(newPaid);
        BigDecimal total = billing.getTotalAmount() != null ? billing.getTotalAmount() : BigDecimal.ZERO;
        BigDecimal insurance = billing.getInsuranceCoveredAmount() != null ? billing.getInsuranceCoveredAmount() : BigDecimal.ZERO;
        if (newPaid.add(insurance).compareTo(total) >= 0) {
            billing.setStatus(PaymentStatus.PAID);
        } else if (newPaid.compareTo(BigDecimal.ZERO) > 0) {
            billing.setStatus(PaymentStatus.PARTIAL);
        }
        billingRepository.save(billing);
        billing = billingRepository.findById(paymentDto.getBillingId()).get();
        return mapToDto(billing);
    }

    public BillingDTO getBillingByVisit(Long visitId) {
        Long hospitalId = TenantContext.getCurrentHospitalId();
        if (hospitalId != null) {
            return billingRepository.findByHospitalIdAndVisitId(hospitalId, visitId)
                    .map(this::mapToDto)
                    .orElseThrow(() -> new ResourceNotFoundException("Billing not found for visit: " + visitId));
        }
        return billingRepository.findByVisitId(visitId)
                .map(this::mapToDto)
                .orElseThrow(() -> new ResourceNotFoundException("Billing not found for visit: " + visitId));
    }

    @Transactional(readOnly = false)
    public BillingDTO populateFromVisit(Long billingId) {
        Long hospitalId = TenantContext.getCurrentHospitalId();
        Billing billing;
        if (hospitalId != null) {
            billing = billingRepository.findByIdAndHospitalId(billingId, hospitalId)
                    .orElseThrow(() -> new ResourceNotFoundException("Billing", billingId));
        } else {
            billing = billingRepository.findById(billingId)
                    .orElseThrow(() -> new ResourceNotFoundException("Billing", billingId));
        }
        if (billing.getVisit() == null) {
            throw new IllegalStateException("Billing is not linked to a visit");
        }
        com.helvinotech.hms.entity.Visit visit = billing.getVisit();

        // Add prescriptions as pharmacy items (only undispensed ones not already billed)
        for (com.helvinotech.hms.entity.Prescription rx : visit.getPrescriptions()) {
            String desc = (rx.getDrug() != null ? rx.getDrug().getGenericName() : "Drug") +
                    " - " + rx.getDosage() + " x " + rx.getQuantityPrescribed() + " units";
            boolean alreadyBilled = billing.getItems().stream()
                    .anyMatch(i -> i.getDescription().equals(desc));
            if (!alreadyBilled) {
                BigDecimal unitPrice = rx.getDrug() != null && rx.getDrug().getSellingPrice() != null
                        ? rx.getDrug().getSellingPrice()
                        : BigDecimal.ZERO;
                BillingItem item = BillingItem.builder()
                        .billing(billing)
                        .serviceType("Pharmacy")
                        .description(desc)
                        .quantity(rx.getQuantityPrescribed() != null ? rx.getQuantityPrescribed() : 1)
                        .unitPrice(unitPrice)
                        .totalPrice(unitPrice.multiply(BigDecimal.valueOf(rx.getQuantityPrescribed() != null ? rx.getQuantityPrescribed() : 1)))
                        .drugId(rx.getDrug() != null ? rx.getDrug().getId() : null)
                        .build();
                billing.getItems().add(item);
            }
        }

        // Add lab orders as lab items (only completed/released ones)
        for (com.helvinotech.hms.entity.LabOrder lo : visit.getLabOrders()) {
            String desc = lo.getTest() != null ? lo.getTest().getTestName() : "Lab Test";
            boolean alreadyBilled = billing.getItems().stream()
                    .anyMatch(i -> i.getDescription().equals(desc) && "Laboratory".equals(i.getServiceType()));
            if (!alreadyBilled) {
                BigDecimal price = lo.getTest() != null && lo.getTest().getPrice() != null
                        ? lo.getTest().getPrice()
                        : BigDecimal.ZERO;
                BillingItem item = BillingItem.builder()
                        .billing(billing)
                        .serviceType("Laboratory")
                        .description(desc)
                        .quantity(1)
                        .unitPrice(price)
                        .totalPrice(price)
                        .build();
                billing.getItems().add(item);
            }
        }

        // Add imaging orders
        for (com.helvinotech.hms.entity.ImagingOrder io : visit.getImagingOrders()) {
            String desc = io.getImagingType() + (io.getBodyPart() != null ? " - " + io.getBodyPart() : "");
            boolean alreadyBilled = billing.getItems().stream()
                    .anyMatch(i -> i.getDescription().equals(desc) && "Imaging".equals(i.getServiceType()));
            if (!alreadyBilled) {
                BigDecimal price = io.getPrice() != null ? io.getPrice() : BigDecimal.ZERO;
                BillingItem item = BillingItem.builder()
                        .billing(billing)
                        .serviceType("Imaging")
                        .description(desc)
                        .quantity(1)
                        .unitPrice(price)
                        .totalPrice(price)
                        .build();
                billing.getItems().add(item);
            }
        }

        recalculateTotal(billing);
        billing = billingRepository.save(billing);
        return mapToDto(billing);
    }

    public BigDecimal getRevenueToday() {
        Long hospitalId = TenantContext.getCurrentHospitalId();
        LocalDateTime startOfDay = LocalDateTime.now().toLocalDate().atStartOfDay();
        if (hospitalId != null) {
            return billingRepository.sumRevenueByDateRange(hospitalId, startOfDay, startOfDay.plusDays(1));
        }
        return billingRepository.sumRevenueByDateRange(startOfDay, startOfDay.plusDays(1));
    }

    public BigDecimal getRevenueThisMonth() {
        Long hospitalId = TenantContext.getCurrentHospitalId();
        LocalDateTime startOfMonth = LocalDateTime.now().withDayOfMonth(1).toLocalDate().atStartOfDay();
        if (hospitalId != null) {
            return billingRepository.sumRevenueByDateRange(hospitalId, startOfMonth, LocalDateTime.now());
        }
        return billingRepository.sumRevenueByDateRange(startOfMonth, LocalDateTime.now());
    }

    private void recalculateTotal(Billing billing) {
        BigDecimal total = billing.getItems().stream()
                .map(i -> i.getTotalPrice() != null ? i.getTotalPrice() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        billing.setTotalAmount(total);
    }

    private void updateStatusAfterChange(Billing billing) {
        BigDecimal paid = billing.getPaidAmount() != null ? billing.getPaidAmount() : BigDecimal.ZERO;
        BigDecimal total = billing.getTotalAmount() != null ? billing.getTotalAmount() : BigDecimal.ZERO;
        BigDecimal insurance = billing.getInsuranceCoveredAmount() != null ? billing.getInsuranceCoveredAmount() : BigDecimal.ZERO;
        BigDecimal effectiveCovered = paid.add(insurance);
        if (paid.compareTo(BigDecimal.ZERO) == 0 && insurance.compareTo(BigDecimal.ZERO) == 0) {
            billing.setStatus(PaymentStatus.PENDING);
        } else if (effectiveCovered.compareTo(total) >= 0) {
            billing.setStatus(PaymentStatus.PAID);
        } else {
            billing.setStatus(PaymentStatus.PARTIAL);
        }
    }

    private String generateInvoiceNumber() {
        long n = invoiceSequence.incrementAndGet();
        return "INV-" + Year.now().getValue() + "-" + String.format("%06d", n);
    }

    private BillingDTO mapToDto(Billing b) {
        BillingDTO dto = new BillingDTO();
        dto.setId(b.getId());
        dto.setInvoiceNumber(b.getInvoiceNumber());
        dto.setPatientId(b.getPatient().getId());
        dto.setPatientName(b.getPatient().getFullName());
        dto.setPatientNo(b.getPatient().getPatientNo());
        if (b.getPatient().getDateOfBirth() != null) {
            dto.setPatientDateOfBirth(b.getPatient().getDateOfBirth());
            dto.setPatientAge(Period.between(b.getPatient().getDateOfBirth(), LocalDate.now()).getYears());
        }
        if (b.getVisit() != null) dto.setVisitId(b.getVisit().getId());
        dto.setTotalAmount(b.getTotalAmount());
        dto.setPaidAmount(b.getPaidAmount());
        dto.setInsuranceCoveredAmount(b.getInsuranceCoveredAmount());
        dto.setStatus(b.getStatus());
        dto.setItems(b.getItems().stream().map(this::mapItemToDto).collect(Collectors.toList()));
        dto.setPayments(b.getPayments().stream().map(this::mapPaymentToDto).collect(Collectors.toList()));
        dto.setCreatedAt(b.getCreatedAt());
        dto.setBilledDate(b.getBilledDate());
        dto.setNotes(b.getNotes());
        return dto;
    }

    private BillingItemDTO mapItemToDto(BillingItem i) {
        BillingItemDTO dto = new BillingItemDTO();
        dto.setId(i.getId());
        dto.setBillingId(i.getBilling().getId());
        dto.setServiceType(i.getServiceType());
        dto.setDescription(i.getDescription());
        dto.setQuantity(i.getQuantity());
        dto.setUnitPrice(i.getUnitPrice());
        dto.setTotalPrice(i.getTotalPrice());
        dto.setServiceId(i.getServiceId());
        dto.setDrugId(i.getDrugId());
        return dto;
    }

    private PaymentDTO mapPaymentToDto(Payment p) {
        PaymentDTO dto = new PaymentDTO();
        dto.setId(p.getId());
        dto.setBillingId(p.getBilling().getId());
        dto.setAmount(p.getAmount());
        dto.setPaymentMethod(p.getPaymentMethod());
        dto.setReferenceNumber(p.getReferenceNumber());
        dto.setReceiptNumber(p.getReceiptNumber());
        if (p.getReceivedBy() != null) dto.setReceivedByName(p.getReceivedBy().getFullName());
        dto.setCreatedAt(p.getCreatedAt());
        return dto;
    }
}
