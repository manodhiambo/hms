package com.helvinotech.hms.service;

import com.helvinotech.hms.dto.ActivityLogDTO;
import com.helvinotech.hms.entity.ActivityLog;
import com.helvinotech.hms.entity.User;
import com.helvinotech.hms.repository.ActivityLogRepository;
import com.helvinotech.hms.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;

    /** Log with an explicit User object (for login, deletion, etc.) */
    @Transactional(readOnly = false)
    public void log(User user, String action, String entityType, Long entityId, String details, String ipAddress) {
        Long hospitalId = (user != null) ? user.getHospitalId() : TenantContext.getCurrentHospitalId();
        ActivityLog log = ActivityLog.builder()
                .user(user)
                .actorName(user != null ? user.getFullName() : "System")
                .actorRole(user != null ? user.getRole().name() : "SYSTEM")
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .details(details)
                .ipAddress(ipAddress)
                .hospitalId(hospitalId)
                .build();
        activityLogRepository.save(log);
    }

    /** Log using the currently authenticated user from SecurityContext (for service-layer calls). */
    @Transactional(readOnly = false)
    public void logCurrentUser(String action, String entityType, Long entityId, String details) {
        User user = getCurrentUser();
        log(user, action, entityType, entityId, details, null);
    }

    @Transactional(readOnly = true)
    public Page<ActivityLogDTO> getAllLogs(Pageable pageable) {
        Long hospitalId = TenantContext.getCurrentHospitalId();
        if (hospitalId != null) {
            return activityLogRepository.findByHospitalIdOrderByCreatedAtDesc(hospitalId, pageable).map(this::mapToDto);
        }
        return activityLogRepository.findAllByOrderByCreatedAtDesc(pageable).map(this::mapToDto);
    }

    @Transactional(readOnly = true)
    public Page<ActivityLogDTO> getLogsByFilters(Long userId, String action,
                                                  LocalDateTime start, LocalDateTime end,
                                                  Pageable pageable) {
        Long hospitalId = TenantContext.getCurrentHospitalId();
        if (hospitalId != null) {
            return activityLogRepository.findByFilters(hospitalId, userId, action, start, end, pageable).map(this::mapToDto);
        }
        return activityLogRepository.findByFilters(userId, action, start, end, pageable).map(this::mapToDto);
    }

    private ActivityLogDTO mapToDto(ActivityLog log) {
        ActivityLogDTO dto = new ActivityLogDTO();
        dto.setId(log.getId());
        dto.setUserId(log.getUser() != null ? log.getUser().getId() : null);
        dto.setActorName(log.getActorName());
        dto.setActorRole(log.getActorRole());
        dto.setAction(log.getAction());
        dto.setEntityType(log.getEntityType());
        dto.setEntityId(log.getEntityId());
        dto.setDetails(log.getDetails());
        dto.setIpAddress(log.getIpAddress());
        dto.setCreatedAt(log.getCreatedAt());
        return dto;
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof User u) {
            return u;
        }
        return null;
    }
}
