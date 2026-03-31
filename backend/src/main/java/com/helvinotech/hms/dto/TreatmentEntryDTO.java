package com.helvinotech.hms.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class TreatmentEntryDTO {
    private Long id;
    @NotNull
    private Long admissionId;
    private Long recordedById;
    private String recordedByName;
    @NotBlank
    private String treatmentType;
    @NotBlank
    private String description;
    private String dose;
    private String route;
    private String frequency;
    private String scheduledTime;
    private LocalDateTime administeredAt;
    private String notes;
    private LocalDateTime createdAt;
}
