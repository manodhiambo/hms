package com.helvinotech.hms.controller;

import com.helvinotech.hms.dto.ApiResponse;
import com.helvinotech.hms.dto.AuthResponse;
import com.helvinotech.hms.dto.HospitalDTO;
import com.helvinotech.hms.service.HospitalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/hospitals")
@RequiredArgsConstructor
public class HospitalController {

    private final HospitalService hospitalService;

    /** Public — anyone can register a hospital (self-serve from landing page) */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<HospitalDTO>> register(@RequestBody HospitalDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Hospital registered successfully", hospitalService.register(dto)));
    }

    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<HospitalDTO>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(hospitalService.getAllHospitals()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<HospitalDTO>> getOne(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(hospitalService.getHospital(id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<HospitalDTO>> update(@PathVariable Long id, @RequestBody HospitalDTO dto) {
        return ResponseEntity.ok(ApiResponse.success(hospitalService.update(id, dto)));
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<HospitalDTO>> activate(@PathVariable Long id,
                                                              @RequestBody(required = false) Map<String, String> body) {
        String notes = body != null ? body.get("notes") : null;
        return ResponseEntity.ok(ApiResponse.success("Hospital activated", hospitalService.activate(id, notes)));
    }

    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<HospitalDTO>> deactivate(@PathVariable Long id,
                                                                @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : null;
        return ResponseEntity.ok(ApiResponse.success("Hospital deactivated", hospitalService.deactivate(id, reason)));
    }

    /** SUPER_ADMIN impersonates a hospital — returns a token scoped to that hospital's admin */
    @PostMapping("/{id}/impersonate")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<AuthResponse>> impersonate(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(hospitalService.impersonate(id)));
    }
}
