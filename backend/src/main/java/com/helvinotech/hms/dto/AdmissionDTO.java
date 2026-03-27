package com.helvinotech.hms.dto;

import com.helvinotech.hms.enums.AdmissionStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AdmissionDTO {
    private Long id;
    @NotNull
    private Long patientId;
    private String patientName;
    private String patientNo;
    private Long visitId;
    @NotNull
    private Long bedId;
    private String bedNumber;
    private String roomNumber;
    private String wardName;
    private Long admittingDoctorId;
    private String admittingDoctorName;
    private AdmissionStatus status;
    private String admissionReason;
    private String dischargeSummary;
    private LocalDateTime admittedAt;
    private LocalDateTime dischargedAt;
    private LocalDateTime createdAt;
}
