package com.helvinotech.hms.controller;

import com.helvinotech.hms.dto.ApiResponse;
import com.helvinotech.hms.dto.ImagingOrderDTO;
import com.helvinotech.hms.enums.LabOrderStatus;
import com.helvinotech.hms.service.ImagingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/imaging")
@RequiredArgsConstructor
public class ImagingController {

    private final ImagingService imagingService;

    @PostMapping("/orders")
    public ResponseEntity<ApiResponse<ImagingOrderDTO>> createOrder(@Valid @RequestBody ImagingOrderDTO dto) {
        return ResponseEntity.ok(ApiResponse.success(imagingService.createOrder(dto)));
    }

    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<Page<ImagingOrderDTO>>> getAll(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(imagingService.getAllOrders(pageable)));
    }

    @GetMapping("/orders/visit/{visitId}")
    public ResponseEntity<ApiResponse<List<ImagingOrderDTO>>> getByVisit(@PathVariable Long visitId) {
        return ResponseEntity.ok(ApiResponse.success(imagingService.getOrdersByVisit(visitId)));
    }

    @GetMapping("/orders/status/{status}")
    public ResponseEntity<ApiResponse<Page<ImagingOrderDTO>>> getByStatus(
            @PathVariable LabOrderStatus status, Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(imagingService.getOrdersByStatus(status, pageable)));
    }

    @PutMapping("/orders/{id}/complete")
    public ResponseEntity<ApiResponse<ImagingOrderDTO>> complete(
            @PathVariable Long id, @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(ApiResponse.success(imagingService.completeOrder(id,
                (String) body.get("findings"),
                (String) body.get("impression"),
                Long.valueOf(body.get("radiologistId").toString()))));
    }
}
