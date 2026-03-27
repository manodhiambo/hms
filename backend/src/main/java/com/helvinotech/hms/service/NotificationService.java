package com.helvinotech.hms.service;

import com.helvinotech.hms.dto.NotificationDTO;
import com.helvinotech.hms.entity.Notification;
import com.helvinotech.hms.entity.User;
import com.helvinotech.hms.enums.NotificationType;
import com.helvinotech.hms.exception.ResourceNotFoundException;
import com.helvinotech.hms.repository.NotificationRepository;
import com.helvinotech.hms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = false)
    public void createNotification(Long userId, NotificationType type, String title, String message) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        Notification n = Notification.builder()
                .user(user).type(type).title(title).message(message).build();
        notificationRepository.save(n);
    }

    public Page<NotificationDTO> getUserNotifications(Long userId, Pageable pageable) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable).map(this::mapToDto);
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    @Transactional(readOnly = false)
    public void markAsRead(Long notificationId) {
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", notificationId));
        n.setRead(true);
        notificationRepository.save(n);
    }

    @Transactional(readOnly = false)
    public void markAllAsRead(Long userId) {
        notificationRepository.findByUserIdAndReadFalse(userId)
                .forEach(n -> { n.setRead(true); notificationRepository.save(n); });
    }

    private NotificationDTO mapToDto(Notification n) {
        NotificationDTO dto = new NotificationDTO();
        dto.setId(n.getId());
        dto.setUserId(n.getUser().getId());
        dto.setType(n.getType());
        dto.setTitle(n.getTitle());
        dto.setMessage(n.getMessage());
        dto.setRead(n.isRead());
        dto.setCreatedAt(n.getCreatedAt());
        return dto;
    }
}
