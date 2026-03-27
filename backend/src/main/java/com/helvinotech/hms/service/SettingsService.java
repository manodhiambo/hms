package com.helvinotech.hms.service;

import com.helvinotech.hms.dto.HospitalSettingsDTO;
import com.helvinotech.hms.entity.HospitalSettings;
import com.helvinotech.hms.repository.HospitalSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SettingsService {

    private final HospitalSettingsRepository repository;

    public HospitalSettingsDTO getSettings() {
        HospitalSettings settings = repository.findById(1L).orElseGet(() -> {
            HospitalSettings defaults = new HospitalSettings();
            defaults.setId(1L);
            return defaults;
        });
        return mapToDto(settings);
    }

    @Transactional
    public HospitalSettingsDTO updateSettings(HospitalSettingsDTO dto) {
        HospitalSettings settings = repository.findById(1L).orElseGet(() -> {
            HospitalSettings s = new HospitalSettings();
            s.setId(1L);
            return s;
        });
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
