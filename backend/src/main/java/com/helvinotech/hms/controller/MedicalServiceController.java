package com.helvinotech.hms.controller;

import com.helvinotech.hms.dto.ApiResponse;
import com.helvinotech.hms.dto.MedicalServiceDTO;
import com.helvinotech.hms.service.MedicalServiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/services")
@RequiredArgsConstructor
public class MedicalServiceController {

    private final MedicalServiceService medicalServiceService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<MedicalServiceDTO>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(medicalServiceService.getAll()));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<MedicalServiceDTO>>> getActive() {
        return ResponseEntity.ok(ApiResponse.success(medicalServiceService.getActive()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MedicalServiceDTO>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(medicalServiceService.getById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN')")
    public ResponseEntity<ApiResponse<MedicalServiceDTO>> create(@RequestBody MedicalServiceDTO dto) {
        return ResponseEntity.ok(ApiResponse.success(medicalServiceService.create(dto)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN')")
    public ResponseEntity<ApiResponse<MedicalServiceDTO>> update(@PathVariable Long id,
                                                                  @RequestBody MedicalServiceDTO dto) {
        return ResponseEntity.ok(ApiResponse.success(medicalServiceService.update(id, dto)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        medicalServiceService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Service deleted successfully", null));
    }
}
