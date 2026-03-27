package com.helvinotech.hms.dto;

import com.helvinotech.hms.enums.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class PaymentDTO {
    private Long id;
    @NotNull
    private Long billingId;
    @NotNull
    private BigDecimal amount;
    @NotNull
    private PaymentMethod paymentMethod;
    private String referenceNumber;
    private String receiptNumber;
    private String receivedByName;
    private LocalDateTime createdAt;
}
