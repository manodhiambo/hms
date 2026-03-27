package com.helvinotech.hms.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "lab_tests")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class LabTest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String testName;

    private String testCode;

    private String category; // Hematology, Biochemistry, Microbiology, etc.

    private String sampleType; // Blood, Urine, Stool, etc.

    @Column(precision = 10, scale = 2, nullable = false)
    private BigDecimal price;

    private String referenceRange;

    private String unit;

    private Integer turnaroundTimeHours;

    @Builder.Default
    private boolean active = true;
}
