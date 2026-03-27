package com.helvinotech.hms.entity;

import com.helvinotech.hms.enums.TriagePriority;
import com.helvinotech.hms.enums.TriageStatus;
import com.helvinotech.hms.enums.VisitType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "visits")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Visit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id")
    private User doctor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VisitType visitType;

    @Column(columnDefinition = "TEXT")
    private String chiefComplaint;

    @Column(columnDefinition = "TEXT")
    private String presentingIllness;

    @Column(columnDefinition = "TEXT")
    private String examination;

    @Column(columnDefinition = "TEXT")
    private String diagnosis;

    private String diagnosisCode; // ICD-10

    @Column(columnDefinition = "TEXT")
    private String treatmentPlan;

    @Column(columnDefinition = "TEXT")
    private String doctorNotes;

    // Vital Signs
    private String bloodPressure;
    private Double temperature;
    private Integer pulseRate;
    private Integer respiratoryRate;
    private Double weight;
    private Double height;
    private Double oxygenSaturation;

    // Triage Fields
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private TriageStatus triageStatus = TriageStatus.WAITING;

    @Enumerated(EnumType.STRING)
    private TriagePriority triagePriority;

    @Column(columnDefinition = "TEXT")
    private String triageNotes;

    private LocalDateTime triagedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "triaged_by")
    private User triagedBy;

    @Builder.Default
    private boolean completed = false;

    @OneToMany(mappedBy = "visit", cascade = CascadeType.ALL)
    @Builder.Default
    private List<Prescription> prescriptions = new ArrayList<>();

    @OneToMany(mappedBy = "visit", cascade = CascadeType.ALL)
    @Builder.Default
    private List<LabOrder> labOrders = new ArrayList<>();

    @OneToMany(mappedBy = "visit", cascade = CascadeType.ALL)
    @Builder.Default
    private List<ImagingOrder> imagingOrders = new ArrayList<>();

    @CreationTimestamp
    private LocalDateTime createdAt;
}
