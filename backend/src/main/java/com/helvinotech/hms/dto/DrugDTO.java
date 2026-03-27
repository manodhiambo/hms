package com.helvinotech.hms.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class DrugDTO {
    private Long id;
    @NotBlank
    private String genericName;
    private String brandName;
    private String category;
    private String formulation;
    private String strength;
    @NotNull
    private Integer quantityInStock;
    private Integer reorderLevel;
    private String batchNumber;
    private LocalDate expiryDate;
    private String supplier;
    private BigDecimal costPrice;
    @NotNull
    private BigDecimal sellingPrice;
    private boolean controlled;
    private boolean active;
}
