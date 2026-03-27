package com.helvinotech.hms.entity;

import com.helvinotech.hms.enums.LabOrderStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "lab_orders")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class LabOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "visit_id", nullable = false)
    private Visit visit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_id", nullable = false)
    private LabTest test;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ordered_by")
    private User orderedBy;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private LabOrderStatus status = LabOrderStatus.ORDERED;

    @Column(columnDefinition = "TEXT")
    private String result;

    @Builder.Default
    private boolean abnormal = false;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "processed_by")
    private User processedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verified_by")
    private User verifiedBy;

    private LocalDateTime sampleCollectedAt;
    private LocalDateTime processedAt;
    private LocalDateTime verifiedAt;
    private LocalDateTime releasedAt;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
