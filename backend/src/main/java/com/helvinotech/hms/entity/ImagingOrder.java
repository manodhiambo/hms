package com.helvinotech.hms.entity;

import com.helvinotech.hms.enums.ImagingType;
import com.helvinotech.hms.enums.LabOrderStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "imaging_orders")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ImagingOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "visit_id", nullable = false)
    private Visit visit;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ImagingType imagingType;

    private String bodyPart;

    @Column(columnDefinition = "TEXT")
    private String clinicalIndication;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private LabOrderStatus status = LabOrderStatus.ORDERED;

    @Column(columnDefinition = "TEXT")
    private String findings;

    @Column(columnDefinition = "TEXT")
    private String impression;

    @Column(precision = 10, scale = 2)
    private BigDecimal price;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "radiologist_id")
    private User radiologist;

    private LocalDateTime completedAt;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
