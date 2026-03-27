package com.helvinotech.hms.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class NursingNoteDTO {
    private Long id;
    @NotNull
    private Long admissionId;
    private Long nurseId;
    private String nurseName;
    @NotBlank
    private String notes;
    private String vitalSigns;
    private LocalDateTime createdAt;
}
