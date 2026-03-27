package com.helvinotech.hms.dto;

import com.helvinotech.hms.enums.PaymentStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class BillingDTO {
    private Long id;
    private String invoiceNumber;
    private Long patientId;
    private String patientName;
    private String patientNo;
    private Integer patientAge;
    private LocalDate patientDateOfBirth;
    private Long visitId;
    private BigDecimal totalAmount;
    private BigDecimal paidAmount;
    private BigDecimal insuranceCoveredAmount;
    private PaymentStatus status;
    private List<BillingItemDTO> items;
    private List<PaymentDTO> payments;
    private LocalDateTime createdAt;
    private LocalDate billedDate;
    private String notes;
}
