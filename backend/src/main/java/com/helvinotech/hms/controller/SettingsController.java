package com.helvinotech.hms.controller;

import com.helvinotech.hms.dto.ApiResponse;
import com.helvinotech.hms.dto.HospitalSettingsDTO;
import com.helvinotech.hms.service.SettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final SettingsService settingsService;

    @GetMapping
    public ResponseEntity<ApiResponse<HospitalSettingsDTO>> get() {
        return ResponseEntity.ok(ApiResponse.success(settingsService.getSettings()));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<HospitalSettingsDTO>> update(@RequestBody HospitalSettingsDTO dto) {
        return ResponseEntity.ok(ApiResponse.success(settingsService.updateSettings(dto)));
    }
}
