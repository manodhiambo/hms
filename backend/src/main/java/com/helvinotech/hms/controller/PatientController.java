package com.helvinotech.hms.controller;

import com.helvinotech.hms.dto.ApiResponse;
import com.helvinotech.hms.dto.PatientDTO;
import com.helvinotech.hms.service.PatientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/patients")
@RequiredArgsConstructor
public class PatientController {

    private final PatientService patientService;

    @PostMapping
    public ResponseEntity<ApiResponse<PatientDTO>> create(@Valid @RequestBody PatientDTO dto) {
        return ResponseEntity.ok(ApiResponse.success(patientService.createPatient(dto)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PatientDTO>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(patientService.getPatient(id)));
    }

    @GetMapping("/by-no/{patientNo}")
    public ResponseEntity<ApiResponse<PatientDTO>> getByNo(@PathVariable String patientNo) {
        return ResponseEntity.ok(ApiResponse.success(patientService.getPatientByNo(patientNo)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<PatientDTO>>> getAll(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(patientService.getAllPatients(pageable)));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<PatientDTO>>> search(@RequestParam String q, Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(patientService.searchPatients(q, pageable)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PatientDTO>> update(@PathVariable Long id, @Valid @RequestBody PatientDTO dto) {
        return ResponseEntity.ok(ApiResponse.success(patientService.updatePatient(id, dto)));
    }

    @GetMapping("/check-duplicates")
    public ResponseEntity<ApiResponse<List<PatientDTO>>> checkDuplicates(
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String idNumber) {
        return ResponseEntity.ok(ApiResponse.success(patientService.checkDuplicates(phone, idNumber)));
    }
}
