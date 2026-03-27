package com.helvinotech.hms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicalServiceDTO {
    private Long id;
    private String serviceName;
    private String category;
    private BigDecimal price;
    private String description;
    private boolean active;
    private LocalDateTime createdAt;
}
