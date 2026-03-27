package com.helvinotech.hms.dto;

import com.helvinotech.hms.enums.TriagePriority;
import com.helvinotech.hms.enums.TriageStatus;
import com.helvinotech.hms.enums.VisitType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class VisitDTO {
    private Long id;
    @NotNull
    private Long patientId;
    private String patientName;
    private String patientNo;
    private Long doctorId;
    private String doctorName;
    @NotNull
    private VisitType visitType;
    private String chiefComplaint;
    private String presentingIllness;
    private String examination;
    private String diagnosis;
    private String diagnosisCode;
    private String treatmentPlan;
    private String doctorNotes;
    private String bloodPressure;
    private Double temperature;
    private Integer pulseRate;
    private Integer respiratoryRate;
    private Double weight;
    private Double height;
    private Double oxygenSaturation;
    // Triage
    private TriageStatus triageStatus;
    private TriagePriority triagePriority;
    private String triageNotes;
    private LocalDateTime triagedAt;
    private Long triagedById;
    private String triagedByName;
    private boolean completed;
    private LocalDateTime createdAt;
    private List<PrescriptionDTO> prescriptions;
    private List<LabOrderDTO> labOrders;
    private List<ImagingOrderDTO> imagingOrders;
}
