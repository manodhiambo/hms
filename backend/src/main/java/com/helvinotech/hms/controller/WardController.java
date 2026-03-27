package com.helvinotech.hms.controller;

import com.helvinotech.hms.dto.*;
import com.helvinotech.hms.enums.AdmissionStatus;
import com.helvinotech.hms.service.WardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wards")
@RequiredArgsConstructor
public class WardController {

    private final WardService wardService;

    // Wards
    @PostMapping
    public ResponseEntity<ApiResponse<WardDTO>> createWard(@Valid @RequestBody WardDTO dto) {
        return ResponseEntity.ok(ApiResponse.success(wardService.createWard(dto)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<WardDTO>>> getAllWards() {
        return ResponseEntity.ok(ApiResponse.success(wardService.getAllWards()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<WardDTO>> updateWard(@PathVariable Long id, @Valid @RequestBody WardDTO dto) {
        return ResponseEntity.ok(ApiResponse.success(wardService.updateWard(id, dto)));
    }

    // Rooms
    @PostMapping("/rooms")
    public ResponseEntity<ApiResponse<RoomDTO>> createRoom(@Valid @RequestBody RoomDTO dto) {
        return ResponseEntity.ok(ApiResponse.success(wardService.createRoom(dto)));
    }

    @GetMapping("/{wardId}/rooms")
    public ResponseEntity<ApiResponse<List<RoomDTO>>> getRoomsByWard(@PathVariable Long wardId) {
        return ResponseEntity.ok(ApiResponse.success(wardService.getRoomsByWard(wardId)));
    }

    // Beds
    @PostMapping("/beds")
    public ResponseEntity<ApiResponse<BedDTO>> createBed(@Valid @RequestBody BedDTO dto) {
        return ResponseEntity.ok(ApiResponse.success(wardService.createBed(dto)));
    }

    @GetMapping("/beds/available")
    public ResponseEntity<ApiResponse<List<BedDTO>>> getAvailableBeds() {
        return ResponseEntity.ok(ApiResponse.success(wardService.getAvailableBeds()));
    }

    // Admissions
    @PostMapping("/admissions")
    public ResponseEntity<ApiResponse<AdmissionDTO>> admit(@Valid @RequestBody AdmissionDTO dto) {
        return ResponseEntity.ok(ApiResponse.success(wardService.admitPatient(dto)));
    }

    @GetMapping("/admissions/status/{status}")
    public ResponseEntity<ApiResponse<Page<AdmissionDTO>>> getAdmissions(
            @PathVariable AdmissionStatus status, Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(wardService.getAdmissionsByStatus(status, pageable)));
    }

    @PutMapping("/admissions/{id}/discharge")
    public ResponseEntity<ApiResponse<AdmissionDTO>> discharge(
            @PathVariable Long id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.success(wardService.dischargePatient(id, body.get("dischargeSummary"))));
    }

    // Nursing Notes
    @PostMapping("/nursing-notes")
    public ResponseEntity<ApiResponse<NursingNoteDTO>> addNote(@Valid @RequestBody NursingNoteDTO dto) {
        return ResponseEntity.ok(ApiResponse.success(wardService.addNursingNote(dto)));
    }

    @GetMapping("/admissions/{admissionId}/nursing-notes")
    public ResponseEntity<ApiResponse<List<NursingNoteDTO>>> getNursingNotes(@PathVariable Long admissionId) {
        return ResponseEntity.ok(ApiResponse.success(wardService.getNursingNotes(admissionId)));
    }
}
