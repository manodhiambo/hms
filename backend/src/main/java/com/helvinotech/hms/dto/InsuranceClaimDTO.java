package com.helvinotech.hms.dto;

import com.helvinotech.hms.enums.ClaimStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class InsuranceClaimDTO {
    private Long id;
    private String claimNumber;
    private Long billingId;
    private String invoiceNumber;
    private Long insuranceCompanyId;
    private String insuranceCompanyName;
    private Long patientId;
    private String patientName;
    private BigDecimal claimAmount;
    private BigDecimal approvedAmount;
    private ClaimStatus status;
    private String remarks;
    private LocalDateTime submittedAt;
    private LocalDateTime createdAt;
}
