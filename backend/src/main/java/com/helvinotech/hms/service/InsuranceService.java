package com.helvinotech.hms.service;

import com.helvinotech.hms.dto.InsuranceClaimDTO;
import com.helvinotech.hms.dto.InsuranceCompanyDTO;
import com.helvinotech.hms.entity.*;
import com.helvinotech.hms.enums.ClaimStatus;
import com.helvinotech.hms.exception.BadRequestException;
import com.helvinotech.hms.exception.ResourceNotFoundException;
import com.helvinotech.hms.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InsuranceService {

    private final InsuranceCompanyRepository companyRepository;
    private final InsuranceClaimRepository claimRepository;
    private final BillingRepository billingRepository;
    private final PatientRepository patientRepository;

    // Companies
    @Transactional(readOnly = false)
    public InsuranceCompanyDTO createCompany(InsuranceCompanyDTO dto) {
        companyRepository.findByName(dto.getName()).ifPresent(existing -> {
            throw new BadRequestException("Insurance company '" + dto.getName() + "' already exists");
        });
        InsuranceCompany c = new InsuranceCompany();
        mapCompanyDtoToEntity(dto, c);
        c.setActive(true);
        return mapCompanyToDto(companyRepository.save(c));
    }

    public List<InsuranceCompanyDTO> getAllCompanies() {
        return companyRepository.findByActiveTrue().stream().map(this::mapCompanyToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = false)
    public InsuranceCompanyDTO updateCompany(Long id, InsuranceCompanyDTO dto) {
        InsuranceCompany c = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Insurance Company", id));
        boolean wasActive = c.isActive(); // preserve: DTO won't carry this
        mapCompanyDtoToEntity(dto, c);
        c.setActive(wasActive); // restore so the company doesn't disappear
        return mapCompanyToDto(companyRepository.save(c));
    }

    // Claims
    @Transactional(readOnly = false)
    public InsuranceClaimDTO createClaim(InsuranceClaimDTO dto) {
        Billing billing = billingRepository.findById(dto.getBillingId())
                .orElseThrow(() -> new ResourceNotFoundException("Billing", dto.getBillingId()));
        InsuranceCompany company = companyRepository.findById(dto.getInsuranceCompanyId())
                .orElseThrow(() -> new ResourceNotFoundException("Insurance Company", dto.getInsuranceCompanyId()));
        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient", dto.getPatientId()));

        InsuranceClaim claim = InsuranceClaim.builder()
                .claimNumber("CLM-" + Year.now().getValue() + "-" + String.format("%06d", claimRepository.count() + 1))
                .billing(billing)
                .insuranceCompany(company)
                .patient(patient)
                .claimAmount(dto.getClaimAmount())
                .remarks(dto.getRemarks())
                .build();
        return mapClaimToDto(claimRepository.save(claim));
    }

    public Page<InsuranceClaimDTO> getClaimsByStatus(ClaimStatus status, Pageable pageable) {
        return claimRepository.findByStatus(status, pageable).map(this::mapClaimToDto);
    }

    @Transactional(readOnly = false)
    public InsuranceClaimDTO updateClaimStatus(Long id, ClaimStatus status, java.math.BigDecimal approvedAmount, String remarks) {
        InsuranceClaim claim = claimRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Insurance Claim", id));
        claim.setStatus(status);
        if (approvedAmount != null) claim.setApprovedAmount(approvedAmount);
        if (remarks != null) claim.setRemarks(remarks);
        if (status == ClaimStatus.SUBMITTED) claim.setSubmittedAt(LocalDateTime.now());
        return mapClaimToDto(claimRepository.save(claim));
    }

    public Page<InsuranceClaimDTO> getAllClaims(Pageable pageable) {
        return claimRepository.findAll(pageable).map(this::mapClaimToDto);
    }

    private void mapCompanyDtoToEntity(InsuranceCompanyDTO dto, InsuranceCompany c) {
        c.setName(dto.getName());
        c.setContactPerson(dto.getContactPerson());
        c.setPhone(dto.getPhone());
        c.setEmail(dto.getEmail());
        c.setAddress(dto.getAddress());
        c.setActive(dto.isActive());
    }

    private InsuranceCompanyDTO mapCompanyToDto(InsuranceCompany c) {
        InsuranceCompanyDTO dto = new InsuranceCompanyDTO();
        dto.setId(c.getId());
        dto.setName(c.getName());
        dto.setContactPerson(c.getContactPerson());
        dto.setPhone(c.getPhone());
        dto.setEmail(c.getEmail());
        dto.setAddress(c.getAddress());
        dto.setActive(c.isActive());
        return dto;
    }

    private InsuranceClaimDTO mapClaimToDto(InsuranceClaim c) {
        InsuranceClaimDTO dto = new InsuranceClaimDTO();
        dto.setId(c.getId());
        dto.setClaimNumber(c.getClaimNumber());
        dto.setBillingId(c.getBilling().getId());
        dto.setInvoiceNumber(c.getBilling().getInvoiceNumber());
        dto.setInsuranceCompanyId(c.getInsuranceCompany().getId());
        dto.setInsuranceCompanyName(c.getInsuranceCompany().getName());
        dto.setPatientId(c.getPatient().getId());
        dto.setPatientName(c.getPatient().getFullName());
        dto.setClaimAmount(c.getClaimAmount());
        dto.setApprovedAmount(c.getApprovedAmount());
        dto.setStatus(c.getStatus());
        dto.setRemarks(c.getRemarks());
        dto.setSubmittedAt(c.getSubmittedAt());
        dto.setCreatedAt(c.getCreatedAt());
        return dto;
    }
}
