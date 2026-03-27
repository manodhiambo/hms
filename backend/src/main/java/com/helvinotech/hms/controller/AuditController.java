package com.helvinotech.hms.controller;

import com.helvinotech.hms.dto.ActivityLogDTO;
import com.helvinotech.hms.dto.ApiResponse;
import com.helvinotech.hms.service.ActivityLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AuditController {

    private final ActivityLogService activityLogService;

    @GetMapping("/logs")
    public ResponseEntity<ApiResponse<Page<ActivityLogDTO>>> getLogs(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ActivityLogDTO> result = (userId != null || action != null || start != null || end != null)
                ? activityLogService.getLogsByFilters(userId, action, start, end, pageable)
                : activityLogService.getAllLogs(pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
