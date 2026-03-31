package com.helvinotech.hms.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "treatment_entries")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class TreatmentEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admission_id", nullable = false)
    private Admission admission;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recorded_by_id")
    private User recordedBy;

    @Column(nullable = false)
    private String treatmentType; // MEDICATION, PROCEDURE, NURSING_CARE, IV_FLUID, OBSERVATION

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    private String dose;
    private String route;
    private String frequency;
    private String scheduledTime;
    private LocalDateTime administeredAt;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "hospital_id")
    private Long hospitalId;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
