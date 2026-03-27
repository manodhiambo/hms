package com.helvinotech.hms.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class ExpenseDTO {
    private Long id;
    @NotBlank
    private String category;
    @NotBlank
    private String description;
    @NotNull
    private BigDecimal amount;
    private LocalDate expenseDate;
    private String referenceNumber;
    private String vendor;
    private String recordedByName;
    private LocalDateTime createdAt;
}
