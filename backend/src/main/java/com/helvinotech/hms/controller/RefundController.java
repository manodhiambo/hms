package com.helvinotech.hms.controller;

import com.helvinotech.hms.dto.ApiResponse;
import com.helvinotech.hms.dto.RefundDTO;
import com.helvinotech.hms.enums.RefundStatus;
import com.helvinotech.hms.service.RefundService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/refunds")
@RequiredArgsConstructor
public class RefundController {

    private final RefundService refundService;

    @PostMapping
    public ResponseEntity<ApiResponse<RefundDTO>> create(@RequestBody RefundDTO dto) {
        return ResponseEntity.ok(ApiResponse.success(refundService.createRefund(dto)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<RefundDTO>>> getAll(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(refundService.getAllRefunds(pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RefundDTO>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(refundService.getRefund(id)));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<Page<RefundDTO>>> getByStatus(
            @PathVariable RefundStatus status, Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(refundService.getRefundsByStatus(status, pageable)));
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<ApiResponse<List<RefundDTO>>> getByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(ApiResponse.success(refundService.getRefundsByPatient(patientId)));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN')")
    public ResponseEntity<ApiResponse<RefundDTO>> approve(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        Long processedById = Long.parseLong(body.getOrDefault("processedById", "0"));
        String refundMethod = body.get("refundMethod");
        String referenceNumber = body.get("referenceNumber");
        return ResponseEntity.ok(ApiResponse.success(
                refundService.approveRefund(id, processedById, refundMethod, referenceNumber)));
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN')")
    public ResponseEntity<ApiResponse<RefundDTO>> reject(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        Long processedById = Long.parseLong(body.getOrDefault("processedById", "0"));
        String notes = body.get("notes");
        return ResponseEntity.ok(ApiResponse.success(
                refundService.rejectRefund(id, processedById, notes)));
    }
}
