package com.helvinotech.hms.service;

import com.helvinotech.hms.dto.HospitalSettingsDTO;
import com.helvinotech.hms.entity.HospitalSettings;
import com.helvinotech.hms.repository.HospitalSettingsRepository;
import com.helvinotech.hms.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SettingsService {

    private final HospitalSettingsRepository repository;

    public HospitalSettingsDTO getSettings() {
        Long hospitalId = TenantContext.getCurrentHospitalId();
        HospitalSettings settings;
        if (hospitalId != null) {
            settings = repository.findByHospitalId(hospitalId).orElseGet(() -> {
                HospitalSettings defaults = new HospitalSettings();
                defaults.setHospitalId(hospitalId);
                return defaults;
            });
        } else {
            // Legacy fallback for SUPER_ADMIN
            settings = repository.findById(1L).orElseGet(() -> {
                HospitalSettings defaults = new HospitalSettings();
                defaults.setId(1L);
                return defaults;
            });
        }
        return mapToDto(settings);
    }

    @Transactional
    public HospitalSettingsDTO updateSettings(HospitalSettingsDTO dto) {
        Long hospitalId = TenantContext.getCurrentHospitalId();
        HospitalSettings settings;
        if (hospitalId != null) {
            settings = repository.findByHospitalId(hospitalId).orElseGet(() -> {
                HospitalSettings s = new HospitalSettings();
                s.setHospitalId(hospitalId);
                return s;
            });
        } else {
            settings = repository.findById(1L).orElseGet(() -> {
                HospitalSettings s = new HospitalSettings();
                s.setId(1L);
                return s;
            });
        }
        settings.setName(dto.getName());
        settings.setTagline(dto.getTagline());
        settings.setAddress(dto.getAddress());
        settings.setPhone(dto.getPhone());
        settings.setEmail(dto.getEmail());
        return mapToDto(repository.save(settings));
    }

    private HospitalSettingsDTO mapToDto(HospitalSettings s) {
        HospitalSettingsDTO dto = new HospitalSettingsDTO();
        dto.setName(s.getName());
        dto.setTagline(s.getTagline());
        dto.setAddress(s.getAddress());
        dto.setPhone(s.getPhone());
        dto.setEmail(s.getEmail());
        return dto;
    }
}
