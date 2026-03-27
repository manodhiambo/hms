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
    private Long id = 1L; // Always a single row

    private String name;
    private String tagline;

    @Column(length = 500)
    private String address;

    private String phone;
    private String email;
}
