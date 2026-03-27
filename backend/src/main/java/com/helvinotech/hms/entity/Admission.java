package com.helvinotech.hms.entity;

import com.helvinotech.hms.enums.AdmissionStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "admissions")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Admission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "visit_id")
    private Visit visit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bed_id", nullable = false)
    private Bed bed;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admitting_doctor_id")
    private User admittingDoctor;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private AdmissionStatus status = AdmissionStatus.ADMITTED;

    @Column(columnDefinition = "TEXT")
    private String admissionReason;

    @Column(columnDefinition = "TEXT")
    private String dischargeSummary;

    private LocalDateTime admittedAt;

    private LocalDateTime dischargedAt;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
