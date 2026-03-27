package com.helvinotech.hms.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "hospital_settings")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class HospitalSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Links settings to a specific hospital tenant. */
    @Column(name = "hospital_id", unique = true)
    private Long hospitalId;

    private String name;
    private String tagline;

    @Column(length = 500)
    private String address;

    private String phone;
    private String email;
}
