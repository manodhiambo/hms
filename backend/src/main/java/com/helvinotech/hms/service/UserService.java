package com.helvinotech.hms.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.helvinotech.hms.dto.UserDTO;
import com.helvinotech.hms.entity.User;
import com.helvinotech.hms.enums.UserRole;
import com.helvinotech.hms.exception.BadRequestException;
import com.helvinotech.hms.exception.ResourceNotFoundException;
import com.helvinotech.hms.repository.*;
import com.helvinotech.hms.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private static final int PASSWORD_HISTORY_SIZE = 5;
    private static final Pattern UPPERCASE = Pattern.compile("[A-Z]");
    private static final Pattern LOWERCASE = Pattern.compile("[a-z]");
    private static final Pattern DIGIT = Pattern.compile("[0-9]");
    private static final Pattern SPECIAL = Pattern.compile("[^A-Za-z0-9]");
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ActivityLogRepository activityLogRepository;
    private final VisitRepository visitRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final LabOrderRepository labOrderRepository;
    private final AdmissionRepository admissionRepository;
    private final ImagingOrderRepository imagingOrderRepository;
    private final ExpenseRepository expenseRepository;
    private final NursingNoteRepository nursingNoteRepository;

    @Transactional(readOnly = false)
    public UserDTO createUser(UserDTO dto) {
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new BadRequestException("Email already in use: " + dto.getEmail());
        }
        Long hospitalId = TenantContext.getCurrentHospitalId();
        User user = User.builder()
                .fullName(dto.getFullName())
                .email(dto.getEmail())
                .passwordHash(passwordEncoder.encode(dto.getPassword()))
                .plainPassword(dto.getPassword())
                .phone(dto.getPhone())
                .role(dto.getRole())
                .department(dto.getDepartment())
                .specialization(dto.getSpecialization())
                .licenseNumber(dto.getLicenseNumber())
                .active(true)
                .hospitalId(hospitalId)
                .build();
        return mapToDto(userRepository.save(user));
    }

    public UserDTO getUser(Long id) {
        Long hospitalId = TenantContext.getCurrentHospitalId();
        User user;
        if (hospitalId != null) {
            user = userRepository.findByIdAndHospitalId(id, hospitalId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", id));
        } else {
            user = userRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("User", id));
        }
        return mapToDto(user);
    }

    public List<UserDTO> getAllUsers() {
        Long hospitalId = TenantContext.getCurrentHospitalId();
        if (hospitalId != null) {
            return userRepository.findByHospitalId(hospitalId).stream()
                    .map(this::mapToDto).collect(Collectors.toList());
        }
        return userRepository.findAll().stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public List<UserDTO> getUsersByRole(UserRole role) {
        Long hospitalId = TenantContext.getCurrentHospitalId();
        if (hospitalId != null) {
            return userRepository.findByHospitalIdAndRole(hospitalId, role).stream()
                    .map(this::mapToDto).collect(Collectors.toList());
        }
        return userRepository.findByRole(role).stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = false)
    public UserDTO updateUser(Long id, UserDTO dto) {
        Long hospitalId = TenantContext.getCurrentHospitalId();
        User user;
        if (hospitalId != null) {
            user = userRepository.findByIdAndHospitalId(id, hospitalId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", id));
        } else {
            user = userRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("User", id));
        }
        user.setFullName(dto.getFullName());
        user.setPhone(dto.getPhone());
        user.setRole(dto.getRole());
        user.setDepartment(dto.getDepartment());
        user.setSpecialization(dto.getSpecialization());
        user.setLicenseNumber(dto.getLicenseNumber());
        user.setActive(dto.isActive());
        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(dto.getPassword()));
            user.setPlainPassword(dto.getPassword());
        }
        return mapToDto(userRepository.save(user));
    }

    /** For regular users changing their own password — requires current password. */
    @Transactional(readOnly = false)
    public void changePassword(Long id, String currentPassword, String newPassword) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new BadRequestException("Current password is incorrect");
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setPlainPassword(newPassword);
        userRepository.save(user);
    }

    /**
     * Advanced password change for SUPER_ADMIN only.
     * Enforces: current password verification, strength rules, history check (last 5).
     */
    @Transactional(readOnly = false)
    public void changeSuperAdminPassword(Long id, String currentPassword, String newPassword, String confirmPassword) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));

        if (user.getRole() != UserRole.SUPER_ADMIN) {
            throw new BadRequestException("Only SUPER_ADMIN can use this endpoint");
        }

        // 1. Verify current password
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new BadRequestException("Current password is incorrect");
        }

        // 2. Confirm passwords match
        if (!newPassword.equals(confirmPassword)) {
            throw new BadRequestException("New password and confirmation do not match");
        }

        // 3. Strength validation
        validatePasswordStrength(newPassword);

        // 4. Password history check — cannot reuse last 5 passwords
        List<String> history = getPasswordHistory(user);
        for (String oldHash : history) {
            if (passwordEncoder.matches(newPassword, oldHash)) {
                throw new BadRequestException("New password cannot be the same as any of your last " + PASSWORD_HISTORY_SIZE + " passwords");
            }
        }
        // Also check against current password
        if (passwordEncoder.matches(newPassword, user.getPasswordHash())) {
            throw new BadRequestException("New password must be different from your current password");
        }

        // 5. Update history (push current hash, keep last PASSWORD_HISTORY_SIZE)
        history.add(user.getPasswordHash());
        if (history.size() > PASSWORD_HISTORY_SIZE) {
            history = history.subList(history.size() - PASSWORD_HISTORY_SIZE, history.size());
        }
        savePasswordHistory(user, history);

        // 6. Set new password
        String newHash = passwordEncoder.encode(newPassword);
        user.setPasswordHash(newHash);
        user.setPlainPassword(newPassword);
        userRepository.save(user);
    }

    private void validatePasswordStrength(String password) {
        List<String> errors = new ArrayList<>();
        if (password == null || password.length() < 8) {
            errors.add("at least 8 characters");
        }
        if (password != null && !UPPERCASE.matcher(password).find()) {
            errors.add("at least one uppercase letter (A-Z)");
        }
        if (password != null && !LOWERCASE.matcher(password).find()) {
            errors.add("at least one lowercase letter (a-z)");
        }
        if (password != null && !DIGIT.matcher(password).find()) {
            errors.add("at least one digit (0-9)");
        }
        if (password != null && !SPECIAL.matcher(password).find()) {
            errors.add("at least one special character (e.g. @, #, $, !)");
        }
        if (!errors.isEmpty()) {
            throw new BadRequestException("Password must contain: " + String.join(", ", errors));
        }
    }

    private List<String> getPasswordHistory(User user) {
        if (user.getPasswordHistory() == null || user.getPasswordHistory().isBlank()) {
            return new ArrayList<>();
        }
        try {
            return objectMapper.readValue(user.getPasswordHistory(), new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    private void savePasswordHistory(User user, List<String> history) {
        try {
            user.setPasswordHistory(objectMapper.writeValueAsString(history));
        } catch (Exception e) {
            // ignore serialization failure — history is non-critical
        }
    }

    /** For SUPER_ADMIN or HOSPITAL_ADMIN resetting any user's password — no current password required. */
    @Transactional(readOnly = false)
    public void adminResetPassword(Long id, String newPassword) {
        Long hospitalId = TenantContext.getCurrentHospitalId();
        User user;
        if (hospitalId != null) {
            user = userRepository.findByIdAndHospitalId(id, hospitalId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", id));
        } else {
            user = userRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("User", id));
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setPlainPassword(newPassword);
        userRepository.save(user);
    }

    /**
     * Permanently delete a user from the system.
     * Nullifies all FK references across the schema before deleting so audit
     * logs retain the actorName/actorRole strings even after the user row is gone.
     */
    @Transactional(readOnly = false)
    public void deleteUser(Long id) {
        Long hospitalId = TenantContext.getCurrentHospitalId();
        User user;
        if (hospitalId != null) {
            user = userRepository.findByIdAndHospitalId(id, hospitalId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", id));
        } else {
            user = userRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("User", id));
        }

        activityLogRepository.nullifyUser(id);
        visitRepository.nullifyDoctor(id);
        visitRepository.nullifyTriagedBy(id);
        prescriptionRepository.nullifyDispensedBy(id);
        labOrderRepository.nullifyOrderedBy(id);
        labOrderRepository.nullifyProcessedBy(id);
        labOrderRepository.nullifyVerifiedBy(id);
        admissionRepository.nullifyAdmittingDoctor(id);
        imagingOrderRepository.nullifyRadiologist(id);
        expenseRepository.nullifyRecordedBy(id);
        nursingNoteRepository.deleteByNurseId(id);

        userRepository.deleteById(id);
    }

    private UserDTO mapToDto(User u) {
        UserDTO dto = new UserDTO();
        dto.setId(u.getId());
        dto.setFullName(u.getFullName());
        dto.setEmail(u.getEmail());
        dto.setPlainPassword(u.getPlainPassword());
        dto.setPhone(u.getPhone());
        dto.setRole(u.getRole());
        dto.setDepartment(u.getDepartment());
        dto.setSpecialization(u.getSpecialization());
        dto.setLicenseNumber(u.getLicenseNumber());
        dto.setActive(u.isActive());
        dto.setHospitalId(u.getHospitalId());
        return dto;
    }
}
