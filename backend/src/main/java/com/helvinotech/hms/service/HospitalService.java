package com.helvinotech.hms.service;

import com.helvinotech.hms.dto.AuthResponse;
import com.helvinotech.hms.dto.HospitalDTO;
import com.helvinotech.hms.entity.Hospital;
import com.helvinotech.hms.entity.User;
import com.helvinotech.hms.enums.SubscriptionStatus;
import com.helvinotech.hms.enums.UserRole;
import com.helvinotech.hms.exception.BadRequestException;
import com.helvinotech.hms.exception.ResourceNotFoundException;
import com.helvinotech.hms.repository.HospitalRepository;
import com.helvinotech.hms.repository.UserRepository;
import com.helvinotech.hms.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HospitalService {

    private final HospitalRepository hospitalRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    /**
     * Public registration — creates the hospital + a HOSPITAL_ADMIN user.
     * The hospital starts a 5-day trial immediately.
     */
    @Transactional(readOnly = false)
    public HospitalDTO register(HospitalDTO dto) {
        if (hospitalRepository.existsByEmail(dto.getEmail())) {
            throw new BadRequestException("A hospital with this email already exists");
        }
        String slug = generateSlug(dto.getName());
        if (hospitalRepository.existsBySlug(slug)) {
            slug = slug + "-" + System.currentTimeMillis();
        }
        if (dto.getAdminEmail() == null || dto.getAdminPassword() == null) {
            throw new BadRequestException("Admin email and password are required");
        }
        if (userRepository.findByEmail(dto.getAdminEmail()).isPresent()) {
            throw new BadRequestException("A user with this email already exists");
        }

        Hospital hospital = Hospital.builder()
                .name(dto.getName())
                .slug(slug)
                .email(dto.getEmail())
                .phone(dto.getPhone())
                .contactPerson(dto.getContactPerson())
                .county(dto.getCounty())
                .address(dto.getAddress())
                .active(true)
                .subscriptionStatus(SubscriptionStatus.TRIAL)
                .trialEndsAt(LocalDateTime.now().plusDays(5))
                .build();
        hospital = hospitalRepository.save(hospital);

        User admin = User.builder()
                .fullName(dto.getAdminName() != null ? dto.getAdminName() : dto.getContactPerson())
                .email(dto.getAdminEmail())
                .passwordHash(passwordEncoder.encode(dto.getAdminPassword()))
                .plainPassword(dto.getAdminPassword())
                .role(UserRole.HOSPITAL_ADMIN)
                .hospitalId(hospital.getId())
                .active(true)
                .build();
        userRepository.save(admin);

        return mapToDto(hospital);
    }

    public List<HospitalDTO> getAllHospitals() {
        return hospitalRepository.findAll().stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public HospitalDTO getHospital(Long id) {
        return mapToDto(hospitalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital", id)));
    }

    @Transactional(readOnly = false)
    public HospitalDTO activate(Long id, String notes) {
        Hospital hospital = hospitalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital", id));
        hospital.setActive(true);
        hospital.setSubscriptionStatus(SubscriptionStatus.ACTIVE);
        // Default: 1 year from now
        hospital.setSubscriptionExpiresAt(LocalDateTime.now().plusYears(1));
        if (notes != null) hospital.setNotes(notes);
        // Re-enable all users in this hospital
        userRepository.findByHospitalId(hospital.getId())
                .forEach(u -> { u.setActive(true); userRepository.save(u); });
        return mapToDto(hospitalRepository.save(hospital));
    }

    @Transactional(readOnly = false)
    public HospitalDTO deactivate(Long id, String reason) {
        Hospital hospital = hospitalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital", id));
        hospital.setActive(false);
        hospital.setSubscriptionStatus(SubscriptionStatus.DEACTIVATED);
        if (reason != null) hospital.setNotes(reason);
        // Disable all users in this hospital
        userRepository.findByHospitalId(hospital.getId())
                .forEach(u -> { u.setActive(false); userRepository.save(u); });
        return mapToDto(hospitalRepository.save(hospital));
    }

    @Transactional(readOnly = false)
    public HospitalDTO update(Long id, HospitalDTO dto) {
        Hospital hospital = hospitalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital", id));
        if (dto.getName() != null) hospital.setName(dto.getName());
        if (dto.getEmail() != null) hospital.setEmail(dto.getEmail());
        if (dto.getPhone() != null) hospital.setPhone(dto.getPhone());
        if (dto.getContactPerson() != null) hospital.setContactPerson(dto.getContactPerson());
        if (dto.getCounty() != null) hospital.setCounty(dto.getCounty());
        if (dto.getAddress() != null) hospital.setAddress(dto.getAddress());
        if (dto.getNotes() != null) hospital.setNotes(dto.getNotes());
        if (dto.getSubscriptionExpiresAt() != null) hospital.setSubscriptionExpiresAt(dto.getSubscriptionExpiresAt());
        return mapToDto(hospitalRepository.save(hospital));
    }

    /**
     * SUPER_ADMIN impersonates a hospital's admin user — returns a JWT scoped to that hospital.
     */
    public AuthResponse impersonate(Long hospitalId) {
        Hospital hospital = hospitalRepository.findById(hospitalId)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital", hospitalId));
        // Find the HOSPITAL_ADMIN for this hospital
        User admin = userRepository.findByHospitalId(hospitalId).stream()
                .filter(u -> u.getRole() == UserRole.HOSPITAL_ADMIN && u.isActive())
                .findFirst()
                .orElseThrow(() -> new BadRequestException("No active HOSPITAL_ADMIN found for this hospital"));

        String token = tokenProvider.generateToken(admin.getEmail(), hospitalId);
        String refreshToken = tokenProvider.generateRefreshToken(admin.getEmail(), hospitalId);

        return AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .userId(admin.getId())
                .fullName(admin.getFullName())
                .email(admin.getEmail())
                .role(admin.getRole())
                .hospitalId(hospitalId)
                .hospitalName(hospital.getName())
                .build();
    }

    /**
     * Scheduled job: expire trials that ended. Runs every hour.
     */
    @Scheduled(fixedDelay = 3_600_000)
    @Transactional(readOnly = false)
    public void expireTrials() {
        List<Hospital> expired = hospitalRepository.findExpiredTrials(SubscriptionStatus.TRIAL, LocalDateTime.now());
        for (Hospital h : expired) {
            h.setActive(false);
            h.setSubscriptionStatus(SubscriptionStatus.EXPIRED);
            hospitalRepository.save(h);
            userRepository.findByHospitalId(h.getId())
                    .forEach(u -> { u.setActive(false); userRepository.save(u); });
        }
    }

    private String generateSlug(String name) {
        return name.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .trim()
                .replaceAll("\\s+", "-");
    }

    private HospitalDTO mapToDto(Hospital h) {
        HospitalDTO dto = new HospitalDTO();
        dto.setId(h.getId());
        dto.setName(h.getName());
        dto.setSlug(h.getSlug());
        dto.setEmail(h.getEmail());
        dto.setPhone(h.getPhone());
        dto.setContactPerson(h.getContactPerson());
        dto.setCounty(h.getCounty());
        dto.setAddress(h.getAddress());
        dto.setActive(h.isActive());
        dto.setSubscriptionStatus(h.getSubscriptionStatus());
        dto.setTrialEndsAt(h.getTrialEndsAt());
        dto.setSubscriptionExpiresAt(h.getSubscriptionExpiresAt());
        dto.setNotes(h.getNotes());
        dto.setCreatedAt(h.getCreatedAt());
        return dto;
    }
}
