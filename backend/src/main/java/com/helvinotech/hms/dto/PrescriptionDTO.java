package com.helvinotech.hms.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PrescriptionDTO {
    private Long id;
    private Long visitId;
    private String patientName;
    private String patientNo;
    private Long drugId;
    private String drugName;
    private String dosage;
    private String frequency;
    private String duration;
    private Integer quantityPrescribed;
    private Integer quantityDispensed;
    private String instructions;
    private boolean dispensed;
    private String dispensedByName;
    private LocalDateTime dispensedAt;
    private LocalDateTime createdAt;
}
