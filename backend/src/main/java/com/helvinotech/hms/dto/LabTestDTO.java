package com.helvinotech.hms.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class LabTestDTO {
    private Long id;
    @NotBlank
    private String testName;
    private String testCode;
    private String category;
    private String sampleType;
    @NotNull
    private BigDecimal price;
    private String referenceRange;
    private String unit;
    private Integer turnaroundTimeHours;
    private boolean active;
}
