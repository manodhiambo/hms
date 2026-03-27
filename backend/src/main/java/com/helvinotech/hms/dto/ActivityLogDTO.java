package com.helvinotech.hms.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ActivityLogDTO {
    private Long id;
    private Long userId;
    private String actorName;
    private String actorRole;
    private String action;
    private String entityType;
    private Long entityId;
    private String details;
    private String ipAddress;
    private LocalDateTime createdAt;
}
