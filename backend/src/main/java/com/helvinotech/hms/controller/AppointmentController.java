package com.helvinotech.hms.controller;

import com.helvinotech.hms.dto.ApiResponse;
import com.helvinotech.hms.dto.AppointmentDTO;
import com.helvinotech.hms.enums.AppointmentStatus;
import com.helvinotech.hms.service.AppointmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;

    @PostMapping
    public ResponseEntity<ApiResponse<AppointmentDTO>> create(@Valid @RequestBody AppointmentDTO dto) {
        return ResponseEntity.ok(ApiResponse.success(appointmentService.createAppointment(dto)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AppointmentDTO>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(appointmentService.getAppointment(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<AppointmentDTO>>> getAll(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(appointmentService.getAllAppointments(pageable)));
    }

    @GetMapping("/date/{date}")
    public ResponseEntity<ApiResponse<Page<AppointmentDTO>>> getByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date, Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(appointmentService.getAppointmentsByDate(date, pageable)));
    }

    @GetMapping("/doctor/{doctorId}/date/{date}")
    public ResponseEntity<ApiResponse<List<AppointmentDTO>>> getDoctorAppointments(
            @PathVariable Long doctorId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(ApiResponse.success(appointmentService.getDoctorAppointments(doctorId, date)));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<AppointmentDTO>> updateStatus(
            @PathVariable Long id, @RequestParam AppointmentStatus status) {
        return ResponseEntity.ok(ApiResponse.success(appointmentService.updateStatus(id, status)));
    }
}
