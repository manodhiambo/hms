package com.helvinotech.hms.entity;

import com.helvinotech.hms.enums.BedStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "beds")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Bed {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String bedNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private BedStatus status = BedStatus.AVAILABLE;

    @Column(precision = 10, scale = 2)
    private BigDecimal dailyCharge;
}
