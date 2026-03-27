package com.helvinotech.hms.service;

import com.helvinotech.hms.dto.DrugDTO;
import com.helvinotech.hms.dto.PrescriptionDTO;
import com.helvinotech.hms.entity.Drug;
import com.helvinotech.hms.entity.Prescription;
import com.helvinotech.hms.entity.User;
import com.helvinotech.hms.entity.Visit;
import com.helvinotech.hms.exception.BadRequestException;
import com.helvinotech.hms.exception.ResourceNotFoundException;
import com.helvinotech.hms.enums.PaymentStatus;
import com.helvinotech.hms.repository.BillingItemRepository;
import com.helvinotech.hms.repository.BillingRepository;
import com.helvinotech.hms.repository.DrugRepository;
import com.helvinotech.hms.repository.PrescriptionRepository;
import com.helvinotech.hms.repository.UserRepository;
import com.helvinotech.hms.repository.VisitRepository;
import com.helvinotech.hms.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PharmacyService {

    private final DrugRepository drugRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final UserRepository userRepository;
    private final VisitRepository visitRepository;
    private final BillingItemRepository billingItemRepository;
    private final BillingRepository billingRepository;

    @Transactional(readOnly = false)
    public DrugDTO createDrug(DrugDTO dto) {
        Long hospitalId = TenantContext.getCurrentHospitalId();
        Drug drug = new Drug();
        mapDtoToEntity(dto, drug);
        drug.setActive(true);
        drug.setHospitalId(hospitalId);
        return mapDrugToDto(drugRepository.save(drug));
    }

    public DrugDTO getDrug(Long id) {
        return mapDrugToDto(drugRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Drug", id)));
    }

    public Page<DrugDTO> getAllDrugs(Pageable pageable) {
        Long hospitalId = TenantContext.getCurrentHospitalId();
        if (hospitalId != null) {
            return drugRepository.findByHospitalIdAndActiveTrue(hospitalId, pageable).map(this::mapDrugToDto);
        }
        return drugRepository.findByActiveTrue(pageable).map(this::mapDrugToDto);
    }

    public Page<DrugDTO> searchDrugs(String query, Pageable pageable) {
        Long hospitalId = TenantContext.getCurrentHospitalId();
        if (hospitalId != null) {
            return drugRepository.searchDrugs(hospitalId, query, pageable).map(this::mapDrugToDto);
        }
        return drugRepository.searchDrugs(query, pageable).map(this::mapDrugToDto);
    }

    @Transactional(readOnly = false)
    public DrugDTO updateDrug(Long id, DrugDTO dto) {
        Drug drug = drugRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Drug", id));
        boolean wasActive = drug.isActive(); // preserve: DTO won't carry this
        BigDecimal oldSellingPrice = drug.getSellingPrice();
        mapDtoToEntity(dto, drug);
        drug.setActive(wasActive); // restore so the drug doesn't disappear
        Drug saved = drugRepository.save(drug);

        // Cascade price change to unpaid billing items that reference this drug
        if (dto.getSellingPrice() != null && !dto.getSellingPrice().equals(oldSellingPrice)) {
            List<PaymentStatus> unpaid = List.of(PaymentStatus.PENDING, PaymentStatus.PARTIAL);
            billingItemRepository.findByDrugIdAndBillingStatusIn(id, unpaid).forEach(item -> {
                item.setUnitPrice(dto.getSellingPrice());
                item.setTotalPrice(dto.getSellingPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
                billingItemRepository.save(item);
                // Recalculate billing total
                recalculateBillingTotal(item.getBilling().getId());
            });
        }
        return mapDrugToDto(saved);
    }

    @Transactional(readOnly = false)
    public PrescriptionDTO dispensePrescription(Long prescriptionId, Long pharmacistId) {
        Prescription rx = prescriptionRepository.findById(prescriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription", prescriptionId));
        if (rx.isDispensed()) throw new BadRequestException("Already dispensed");

        Drug drug = rx.getDrug();
        int qty = rx.getQuantityPrescribed() != null ? rx.getQuantityPrescribed() : 1;
        if (drug.getQuantityInStock() < qty) throw new BadRequestException("Insufficient stock for " + drug.getGenericName());

        drug.setQuantityInStock(drug.getQuantityInStock() - qty);
        drugRepository.save(drug);

        User pharmacist = userRepository.findById(pharmacistId)
                .orElseThrow(() -> new ResourceNotFoundException("User", pharmacistId));
        rx.setDispensed(true);
        rx.setQuantityDispensed(qty);
        rx.setDispensedBy(pharmacist);
        rx.setDispensedAt(LocalDateTime.now());
        return mapPrescriptionToDto(prescriptionRepository.save(rx));
    }

    @Transactional(readOnly = false)
    public PrescriptionDTO createPrescription(PrescriptionDTO dto) {
        Visit visit = visitRepository.findById(dto.getVisitId())
                .orElseThrow(() -> new ResourceNotFoundException("Visit", dto.getVisitId()));
        Drug drug = drugRepository.findById(dto.getDrugId())
                .orElseThrow(() -> new ResourceNotFoundException("Drug", dto.getDrugId()));
        if (prescriptionRepository.existsByVisitIdAndDrugId(dto.getVisitId(), dto.getDrugId())) {
            throw new BadRequestException(drug.getGenericName() + " has already been prescribed for this visit");
        }
        Long hospitalId = TenantContext.getCurrentHospitalId();
        Prescription rx = Prescription.builder()
                .visit(visit)
                .drug(drug)
                .dosage(dto.getDosage())
                .frequency(dto.getFrequency())
                .duration(dto.getDuration())
                .quantityPrescribed(dto.getQuantityPrescribed())
                .instructions(dto.getInstructions())
                .hospitalId(hospitalId)
                .build();
        return mapPrescriptionToDto(prescriptionRepository.save(rx));
    }

    @Transactional(readOnly = false)
    public void deletePrescription(Long id) {
        Prescription rx = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription", id));
        if (rx.isDispensed()) {
            throw new BadRequestException("Cannot delete a dispensed prescription");
        }
        prescriptionRepository.delete(rx);
    }

    public List<PrescriptionDTO> getPendingPrescriptions() {
        Long hospitalId = TenantContext.getCurrentHospitalId();
        if (hospitalId != null) {
            return prescriptionRepository.findByHospitalIdAndDispensedFalse(hospitalId)
                    .stream().map(this::mapPrescriptionToDto).collect(Collectors.toList());
        }
        return prescriptionRepository.findByDispensedFalse()
                .stream().map(this::mapPrescriptionToDto).collect(Collectors.toList());
    }

    public List<PrescriptionDTO> getVisitPrescriptions(Long visitId) {
        return prescriptionRepository.findByVisitId(visitId)
                .stream().map(this::mapPrescriptionToDto).collect(Collectors.toList());
    }

    public List<PrescriptionDTO> getDispensedPrescriptions() {
        return prescriptionRepository.findByDispensedTrueOrderByDispensedAtDesc()
                .stream().map(this::mapPrescriptionToDto).collect(Collectors.toList());
    }

    public List<DrugDTO> getLowStockDrugs() {
        Long hospitalId = TenantContext.getCurrentHospitalId();
        if (hospitalId != null) {
            return drugRepository.findByHospitalIdAndQuantityInStockLessThanEqual(hospitalId, 10)
                    .stream().map(this::mapDrugToDto).collect(Collectors.toList());
        }
        return drugRepository.findByQuantityInStockLessThanEqual(10)
                .stream().map(this::mapDrugToDto).collect(Collectors.toList());
    }

    public List<DrugDTO> getExpiringDrugs() {
        Long hospitalId = TenantContext.getCurrentHospitalId();
        if (hospitalId != null) {
            return drugRepository.findByHospitalIdAndExpiryDateBefore(hospitalId, LocalDate.now().plusMonths(3))
                    .stream().map(this::mapDrugToDto).collect(Collectors.toList());
        }
        return drugRepository.findByExpiryDateBefore(LocalDate.now().plusMonths(3))
                .stream().map(this::mapDrugToDto).collect(Collectors.toList());
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

    private void mapDtoToEntity(DrugDTO dto, Drug drug) {
        drug.setGenericName(dto.getGenericName());
        drug.setBrandName(dto.getBrandName());
        drug.setCategory(dto.getCategory());
        drug.setFormulation(dto.getFormulation());
        drug.setStrength(dto.getStrength());
        drug.setQuantityInStock(dto.getQuantityInStock());
        drug.setReorderLevel(dto.getReorderLevel());
        drug.setBatchNumber(dto.getBatchNumber());
        drug.setExpiryDate(dto.getExpiryDate());
        drug.setSupplier(dto.getSupplier());
        drug.setCostPrice(dto.getCostPrice());
        drug.setSellingPrice(dto.getSellingPrice());
        drug.setControlled(dto.isControlled());
        drug.setActive(dto.isActive());
    }

    private DrugDTO mapDrugToDto(Drug d) {
        DrugDTO dto = new DrugDTO();
        dto.setId(d.getId());
        dto.setGenericName(d.getGenericName());
        dto.setBrandName(d.getBrandName());
        dto.setCategory(d.getCategory());
        dto.setFormulation(d.getFormulation());
        dto.setStrength(d.getStrength());
        dto.setQuantityInStock(d.getQuantityInStock());
        dto.setReorderLevel(d.getReorderLevel());
        dto.setBatchNumber(d.getBatchNumber());
        dto.setExpiryDate(d.getExpiryDate());
        dto.setSupplier(d.getSupplier());
        dto.setCostPrice(d.getCostPrice());
        dto.setSellingPrice(d.getSellingPrice());
        dto.setControlled(d.isControlled());
        dto.setActive(d.isActive());
        return dto;
    }

    private PrescriptionDTO mapPrescriptionToDto(Prescription p) {
        PrescriptionDTO dto = new PrescriptionDTO();
        dto.setId(p.getId());
        dto.setVisitId(p.getVisit().getId());
        if (p.getVisit().getPatient() != null) {
            dto.setPatientName(p.getVisit().getPatient().getFullName());
            dto.setPatientNo(p.getVisit().getPatient().getPatientNo());
        }
        dto.setDrugId(p.getDrug().getId());
        dto.setDrugName(p.getDrug().getGenericName());
        dto.setDosage(p.getDosage());
        dto.setFrequency(p.getFrequency());
        dto.setDuration(p.getDuration());
        dto.setQuantityPrescribed(p.getQuantityPrescribed());
        dto.setQuantityDispensed(p.getQuantityDispensed());
        dto.setInstructions(p.getInstructions());
        dto.setDispensed(p.isDispensed());
        if (p.getDispensedBy() != null) dto.setDispensedByName(p.getDispensedBy().getFullName());
        dto.setDispensedAt(p.getDispensedAt());
        dto.setCreatedAt(p.getCreatedAt());
        return dto;
    }
}
