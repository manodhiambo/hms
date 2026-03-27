package com.helvinotech.hms.controller;

import com.helvinotech.hms.dto.*;
import com.helvinotech.hms.enums.PaymentStatus;
import com.helvinotech.hms.service.BillingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/billing")
@RequiredArgsConstructor
public class BillingController {

    private final BillingService billingService;

    @PostMapping
    public ResponseEntity<ApiResponse<BillingDTO>> create(@RequestBody BillingDTO dto) {
        return ResponseEntity.ok(ApiResponse.success(billingService.createBilling(dto)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BillingDTO>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(billingService.getBilling(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<BillingDTO>>> getAll(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(billingService.getAllBillings(pageable)));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<BillingDTO>>> search(@RequestParam String q, Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(billingService.searchBillings(q, pageable)));
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<ApiResponse<Page<BillingDTO>>> getByPatient(@PathVariable Long patientId, Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(billingService.getBillingsByPatient(patientId, pageable)));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<Page<BillingDTO>>> getByStatus(@PathVariable PaymentStatus status, Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(billingService.getBillingsByStatus(status, pageable)));
    }

    @PostMapping("/{id}/items")
    public ResponseEntity<ApiResponse<BillingDTO>> addItem(@PathVariable Long id, @Valid @RequestBody BillingItemDTO item) {
        return ResponseEntity.ok(ApiResponse.success(billingService.addItem(id, item)));
    }

    @PutMapping("/{id}/items/{itemId}")
    public ResponseEntity<ApiResponse<BillingDTO>> updateItem(@PathVariable Long id, @PathVariable Long itemId,
                                                               @Valid @RequestBody BillingItemDTO item) {
        return ResponseEntity.ok(ApiResponse.success(billingService.updateItem(id, itemId, item)));
    }

    @DeleteMapping("/{id}/items/{itemId}")
    public ResponseEntity<ApiResponse<BillingDTO>> deleteItem(@PathVariable Long id, @PathVariable Long itemId) {
        return ResponseEntity.ok(ApiResponse.success(billingService.deleteItem(id, itemId)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BillingDTO>> updateBilling(@PathVariable Long id, @RequestBody BillingDTO dto) {
        return ResponseEntity.ok(ApiResponse.success(billingService.updateBilling(id, dto)));
    }

    @PostMapping("/payments")
    public ResponseEntity<ApiResponse<BillingDTO>> processPayment(@Valid @RequestBody PaymentDTO payment) {
        return ResponseEntity.ok(ApiResponse.success(billingService.processPayment(payment)));
    }

    @PostMapping("/{id}/populate-from-visit")
    public ResponseEntity<ApiResponse<BillingDTO>> populateFromVisit(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(billingService.populateFromVisit(id)));
    }

    @GetMapping("/visit/{visitId}")
    public ResponseEntity<ApiResponse<BillingDTO>> getByVisit(@PathVariable Long visitId) {
        return ResponseEntity.ok(ApiResponse.success(billingService.getBillingByVisit(visitId)));
    }
}
