package com.helvinotech.hms.service;

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

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

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
