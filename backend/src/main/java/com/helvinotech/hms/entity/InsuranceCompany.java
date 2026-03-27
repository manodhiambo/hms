package com.helvinotech.hms.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "insurance_companies",
       uniqueConstraints = @UniqueConstraint(name = "uq_insurance_name_hospital",
               columnNames = {"name", "hospital_id"}))
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class InsuranceCompany {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String contactPerson;

    private String phone;

    private String email;

    private String address;

    @Builder.Default
    private boolean active = true;

    @Column(name = "hospital_id")
    private Long hospitalId;
}
