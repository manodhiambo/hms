package com.helvinotech.hms.controller;

import com.helvinotech.hms.dto.ApiResponse;
import com.helvinotech.hms.dto.VisitDTO;
import com.helvinotech.hms.service.VisitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/visits")
@RequiredArgsConstructor
public class VisitController {

    private final VisitService visitService;

    @PostMapping
    public ResponseEntity<ApiResponse<VisitDTO>> create(@Valid @RequestBody VisitDTO dto) {
        return ResponseEntity.ok(ApiResponse.success(visitService.createVisit(dto)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<VisitDTO>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(visitService.getVisit(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<VisitDTO>>> getAll(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(visitService.getAllVisits(pageable)));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<VisitDTO>>> search(@RequestParam String q, Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(visitService.searchVisits(q, pageable)));
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<ApiResponse<Page<VisitDTO>>> getByPatient(@PathVariable Long patientId, Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(visitService.getVisitsByPatient(patientId, pageable)));
    }

    @GetMapping("/doctor/{doctorId}/queue")
    public ResponseEntity<ApiResponse<List<VisitDTO>>> getDoctorQueue(@PathVariable Long doctorId) {
        return ResponseEntity.ok(ApiResponse.success(visitService.getDoctorQueue(doctorId)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<VisitDTO>> update(@PathVariable Long id, @Valid @RequestBody VisitDTO dto) {
        return ResponseEntity.ok(ApiResponse.success(visitService.updateVisit(id, dto)));
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<ApiResponse<VisitDTO>> complete(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(visitService.completeVisit(id)));
    }

    @PutMapping("/{id}/triage")
    public ResponseEntity<ApiResponse<VisitDTO>> updateTriage(@PathVariable Long id, @RequestBody VisitDTO dto) {
        return ResponseEntity.ok(ApiResponse.success(visitService.updateTriage(id, dto)));
    }

    @GetMapping("/triage-queue")
    public ResponseEntity<ApiResponse<List<VisitDTO>>> getTriageQueue() {
        return ResponseEntity.ok(ApiResponse.success(visitService.getTriageQueue()));
    }

    @GetMapping("/lab-review")
    public ResponseEntity<ApiResponse<List<VisitDTO>>> getLabReviewQueue() {
        return ResponseEntity.ok(ApiResponse.success(visitService.getLabReviewQueue()));
    }
}
