package com.helvinotech.hms.controller;

import com.helvinotech.hms.dto.ApiResponse;
import com.helvinotech.hms.dto.InsuranceClaimDTO;
import com.helvinotech.hms.dto.InsuranceCompanyDTO;
import com.helvinotech.hms.enums.ClaimStatus;
import com.helvinotech.hms.service.InsuranceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/insurance")
@RequiredArgsConstructor
public class InsuranceController {

    private final InsuranceService insuranceService;

    // Companies
    @PostMapping("/companies")
    public ResponseEntity<ApiResponse<InsuranceCompanyDTO>> createCompany(@Valid @RequestBody InsuranceCompanyDTO dto) {
        return ResponseEntity.ok(ApiResponse.success(insuranceService.createCompany(dto)));
    }

    @GetMapping("/companies")
    public ResponseEntity<ApiResponse<List<InsuranceCompanyDTO>>> getAllCompanies() {
        return ResponseEntity.ok(ApiResponse.success(insuranceService.getAllCompanies()));
    }

    @PutMapping("/companies/{id}")
    public ResponseEntity<ApiResponse<InsuranceCompanyDTO>> updateCompany(
            @PathVariable Long id, @Valid @RequestBody InsuranceCompanyDTO dto) {
        return ResponseEntity.ok(ApiResponse.success(insuranceService.updateCompany(id, dto)));
    }

    // Claims
    @PostMapping("/claims")
    public ResponseEntity<ApiResponse<InsuranceClaimDTO>> createClaim(@Valid @RequestBody InsuranceClaimDTO dto) {
        return ResponseEntity.ok(ApiResponse.success(insuranceService.createClaim(dto)));
    }

    @GetMapping("/claims")
    public ResponseEntity<ApiResponse<Page<InsuranceClaimDTO>>> getAllClaims(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(insuranceService.getAllClaims(pageable)));
    }

    @GetMapping("/claims/status/{status}")
    public ResponseEntity<ApiResponse<Page<InsuranceClaimDTO>>> getClaimsByStatus(
            @PathVariable ClaimStatus status, Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(insuranceService.getClaimsByStatus(status, pageable)));
    }

    @PutMapping("/claims/{id}/status")
    public ResponseEntity<ApiResponse<InsuranceClaimDTO>> updateClaimStatus(
            @PathVariable Long id, @RequestBody Map<String, Object> body) {
        ClaimStatus status = ClaimStatus.valueOf((String) body.get("status"));
        BigDecimal approvedAmount = body.get("approvedAmount") != null ?
                new BigDecimal(body.get("approvedAmount").toString()) : null;
        String remarks = (String) body.get("remarks");
        return ResponseEntity.ok(ApiResponse.success(insuranceService.updateClaimStatus(id, status, approvedAmount, remarks)));
    }
}
