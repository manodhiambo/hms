package com.helvinotech.hms.dto;

import com.helvinotech.hms.enums.LabOrderStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class LabOrderDTO {
    private Long id;
    private Long visitId;
    private String patientName;
    private String patientNo;
    private Long testId;
    private String testName;
    private String testCode;
    private String category;
    private Long orderedById;
    private String orderedByName;
    private LabOrderStatus status;
    private String result;
    private boolean abnormal;
    private String remarks;
    private String processedByName;
    private String verifiedByName;
    private LocalDateTime sampleCollectedAt;
    private LocalDateTime processedAt;
    private LocalDateTime verifiedAt;
    private LocalDateTime releasedAt;
    private LocalDateTime createdAt;
}
