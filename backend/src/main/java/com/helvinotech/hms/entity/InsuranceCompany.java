package com.helvinotech.hms.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "insurance_companies")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class InsuranceCompany {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    private String contactPerson;

    private String phone;

    private String email;

    private String address;

    @Builder.Default
    private boolean active = true;
}
