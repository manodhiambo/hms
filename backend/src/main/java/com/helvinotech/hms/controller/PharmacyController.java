package com.helvinotech.hms.controller;

import com.helvinotech.hms.dto.ApiResponse;
import com.helvinotech.hms.dto.DrugDTO;
import com.helvinotech.hms.dto.PrescriptionDTO;
import com.helvinotech.hms.service.PharmacyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pharmacy")
@RequiredArgsConstructor
public class PharmacyController {

    private final PharmacyService pharmacyService;

    @PostMapping("/drugs")
    public ResponseEntity<ApiResponse<DrugDTO>> createDrug(@Valid @RequestBody DrugDTO dto) {
        return ResponseEntity.ok(ApiResponse.success(pharmacyService.createDrug(dto)));
    }

    @GetMapping("/drugs/{id}")
    public ResponseEntity<ApiResponse<DrugDTO>> getDrug(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(pharmacyService.getDrug(id)));
    }

    @GetMapping("/drugs")
    public ResponseEntity<ApiResponse<Page<DrugDTO>>> getAllDrugs(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(pharmacyService.getAllDrugs(pageable)));
    }

    @GetMapping("/drugs/search")
    public ResponseEntity<ApiResponse<Page<DrugDTO>>> searchDrugs(@RequestParam String q, Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(pharmacyService.searchDrugs(q, pageable)));
    }

    @PutMapping("/drugs/{id}")
    public ResponseEntity<ApiResponse<DrugDTO>> updateDrug(@PathVariable Long id, @Valid @RequestBody DrugDTO dto) {
        return ResponseEntity.ok(ApiResponse.success(pharmacyService.updateDrug(id, dto)));
    }

    @GetMapping("/drugs/low-stock")
    public ResponseEntity<ApiResponse<List<DrugDTO>>> getLowStock() {
        return ResponseEntity.ok(ApiResponse.success(pharmacyService.getLowStockDrugs()));
    }

    @GetMapping("/drugs/expiring")
    public ResponseEntity<ApiResponse<List<DrugDTO>>> getExpiring() {
        return ResponseEntity.ok(ApiResponse.success(pharmacyService.getExpiringDrugs()));
    }

    @PostMapping("/prescriptions")
    public ResponseEntity<ApiResponse<PrescriptionDTO>> createPrescription(@Valid @RequestBody PrescriptionDTO dto) {
        return ResponseEntity.ok(ApiResponse.success(pharmacyService.createPrescription(dto)));
    }

    @GetMapping("/prescriptions/pending")
    public ResponseEntity<ApiResponse<List<PrescriptionDTO>>> getPendingPrescriptions() {
        return ResponseEntity.ok(ApiResponse.success(pharmacyService.getPendingPrescriptions()));
    }

    @GetMapping("/prescriptions/dispensed")
    public ResponseEntity<ApiResponse<List<PrescriptionDTO>>> getDispensedPrescriptions() {
        return ResponseEntity.ok(ApiResponse.success(pharmacyService.getDispensedPrescriptions()));
    }

    @GetMapping("/prescriptions/visit/{visitId}")
    public ResponseEntity<ApiResponse<List<PrescriptionDTO>>> getVisitPrescriptions(@PathVariable Long visitId) {
        return ResponseEntity.ok(ApiResponse.success(pharmacyService.getVisitPrescriptions(visitId)));
    }

    @PostMapping("/prescriptions/{id}/dispense")
    public ResponseEntity<ApiResponse<PrescriptionDTO>> dispense(
            @PathVariable Long id, @RequestParam Long pharmacistId) {
        return ResponseEntity.ok(ApiResponse.success(pharmacyService.dispensePrescription(id, pharmacistId)));
    }

    @DeleteMapping("/prescriptions/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deletePrescription(@PathVariable Long id) {
        pharmacyService.deletePrescription(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
