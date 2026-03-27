package com.helvinotech.hms.controller;

import com.helvinotech.hms.dto.ApiResponse;
import com.helvinotech.hms.dto.LabOrderDTO;
import com.helvinotech.hms.dto.LabTestDTO;
import com.helvinotech.hms.enums.LabOrderStatus;
import com.helvinotech.hms.service.LabService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/lab")
@RequiredArgsConstructor
public class LabController {

    private final LabService labService;

    // Tests
    @PostMapping("/tests")
    public ResponseEntity<ApiResponse<LabTestDTO>> createTest(@Valid @RequestBody LabTestDTO dto) {
        return ResponseEntity.ok(ApiResponse.success(labService.createTest(dto)));
    }

    @GetMapping("/tests")
    public ResponseEntity<ApiResponse<List<LabTestDTO>>> getAllTests() {
        return ResponseEntity.ok(ApiResponse.success(labService.getAllTests()));
    }

    @PutMapping("/tests/{id}")
    public ResponseEntity<ApiResponse<LabTestDTO>> updateTest(@PathVariable Long id, @Valid @RequestBody LabTestDTO dto) {
        return ResponseEntity.ok(ApiResponse.success(labService.updateTest(id, dto)));
    }

    // Orders
    @PostMapping("/orders")
    public ResponseEntity<ApiResponse<LabOrderDTO>> createOrder(@RequestBody Map<String, Long> body) {
        return ResponseEntity.ok(ApiResponse.success(
                labService.createOrder(body.get("visitId"), body.get("testId"), body.get("orderedById"))));
    }

    @GetMapping("/orders/visit/{visitId}")
    public ResponseEntity<ApiResponse<List<LabOrderDTO>>> getOrdersByVisit(@PathVariable Long visitId) {
        return ResponseEntity.ok(ApiResponse.success(labService.getOrdersByVisit(visitId)));
    }

    @GetMapping("/orders/status/{status}")
    public ResponseEntity<ApiResponse<Page<LabOrderDTO>>> getOrdersByStatus(
            @PathVariable LabOrderStatus status, Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(labService.getOrdersByStatus(status, pageable)));
    }

    @GetMapping("/orders/search")
    public ResponseEntity<ApiResponse<Page<LabOrderDTO>>> searchOrders(
            @RequestParam LabOrderStatus status, @RequestParam String q, Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(labService.searchOrdersByStatus(status, q, pageable)));
    }

    @PutMapping("/orders/{id}/collect-sample")
    public ResponseEntity<ApiResponse<LabOrderDTO>> collectSample(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(labService.collectSample(id)));
    }

    @PutMapping("/orders/{id}/process")
    public ResponseEntity<ApiResponse<LabOrderDTO>> processResult(
            @PathVariable Long id, @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(ApiResponse.success(labService.processResult(id,
                (String) body.get("result"),
                Boolean.TRUE.equals(body.get("abnormal")),
                (String) body.get("remarks"),
                Long.valueOf(body.get("processedById").toString()))));
    }

    @PutMapping("/orders/{id}/verify")
    public ResponseEntity<ApiResponse<LabOrderDTO>> verify(
            @PathVariable Long id, @RequestParam Long verifiedById) {
        return ResponseEntity.ok(ApiResponse.success(labService.verifyResult(id, verifiedById)));
    }

    @PutMapping("/orders/{id}/release")
    public ResponseEntity<ApiResponse<LabOrderDTO>> release(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(labService.releaseResult(id)));
    }
}
