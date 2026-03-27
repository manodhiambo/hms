package com.helvinotech.hms.dto;

import com.helvinotech.hms.enums.ImagingType;
import com.helvinotech.hms.enums.LabOrderStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class ImagingOrderDTO {
    private Long id;
    private Long visitId;
    private ImagingType imagingType;
    private String bodyPart;
    private String clinicalIndication;
    private LabOrderStatus status;
    private String findings;
    private String impression;
    private BigDecimal price;
    private String radiologistName;
    private LocalDateTime completedAt;
    private LocalDateTime createdAt;
}
