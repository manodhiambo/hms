package com.helvinotech.hms.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class WardDTO {
    private Long id;
    @NotBlank
    private String name;
    private String type;
    private Integer totalBeds;
    private boolean active;
    private int availableBeds;
    private int occupiedBeds;
}
