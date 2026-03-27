package com.helvinotech.hms.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "wards",
       uniqueConstraints = @UniqueConstraint(name = "uq_ward_name_hospital",
               columnNames = {"name", "hospital_id"}))
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Ward {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String type; // General, ICU, Maternity, Pediatric, etc.

    private Integer totalBeds;

    @Builder.Default
    private boolean active = true;

    @Column(name = "hospital_id")
    private Long hospitalId;

    @OneToMany(mappedBy = "ward", cascade = CascadeType.ALL)
    @Builder.Default
    private List<Room> rooms = new ArrayList<>();
}
