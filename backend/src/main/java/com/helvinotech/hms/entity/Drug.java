package com.helvinotech.hms.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "drugs")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Drug {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String genericName;

    private String brandName;

    private String category;

    private String formulation; // tablet, syrup, injection, etc.

    private String strength; // e.g., 500mg

    @Column(nullable = false)
    private Integer quantityInStock;

    private Integer reorderLevel;

    private String batchNumber;

    private LocalDate expiryDate;

    private String supplier;

    @Column(precision = 10, scale = 2)
    private BigDecimal costPrice;

    @Column(precision = 10, scale = 2, nullable = false)
    private BigDecimal sellingPrice;

    @Builder.Default
    private boolean controlled = false;

    @Builder.Default
    private boolean active = true;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
