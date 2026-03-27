package com.helvinotech.hms.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "wards")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Ward {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    private String type; // General, ICU, Maternity, Pediatric, etc.

    private Integer totalBeds;

    @Builder.Default
    private boolean active = true;

    @OneToMany(mappedBy = "ward", cascade = CascadeType.ALL)
    @Builder.Default
    private List<Room> rooms = new ArrayList<>();
}
