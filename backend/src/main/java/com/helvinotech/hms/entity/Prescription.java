package com.helvinotech.hms.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "prescriptions")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Prescription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "visit_id", nullable = false)
    private Visit visit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "drug_id", nullable = false)
    private Drug drug;

    @Column(nullable = false)
    private String dosage;

    private String frequency; // e.g., "3 times daily"

    private String duration; // e.g., "7 days"

    private Integer quantityPrescribed;

    private Integer quantityDispensed;

    @Column(columnDefinition = "TEXT")
    private String instructions;

    @Builder.Default
    private boolean dispensed = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dispensed_by")
    private User dispensedBy;

    private LocalDateTime dispensedAt;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
