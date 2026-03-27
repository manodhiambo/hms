package com.helvinotech.hms.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class BillingItemDTO {
    private Long id;
    private Long billingId;
    @NotBlank
    private String serviceType;
    @NotBlank
    private String description;
    @NotNull
    private Integer quantity;
    @NotNull
    private BigDecimal unitPrice;
    private BigDecimal totalPrice;
    private Long serviceId;
    private Long drugId;
}
