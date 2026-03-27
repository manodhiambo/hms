package com.helvinotech.hms.dto;

import com.helvinotech.hms.enums.PaymentMethod;
import com.helvinotech.hms.enums.RefundStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class RefundDTO {
    private Long id;
    private String refundNumber;
    private Long prescriptionId;
    private String drugName;
    private String dosage;
    private Integer quantityDispensed;
    private Long patientId;
    private String patientName;
    private String patientNo;
    private Integer quantityReturned;
    private BigDecimal refundAmount;
    private String reason;
    private String notes;
    private RefundStatus status;
    private PaymentMethod refundMethod;
    private String referenceNumber;
    private String requestedByName;
    private String processedByName;
    private LocalDateTime processedAt;
    private LocalDateTime createdAt;
}
