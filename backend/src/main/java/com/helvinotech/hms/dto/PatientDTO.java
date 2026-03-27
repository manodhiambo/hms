package com.helvinotech.hms.dto;

import com.helvinotech.hms.enums.Gender;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;

@Data
public class PatientDTO {
    private Long id;
    private String patientNo;
    @NotBlank
    private String fullName;
    private Gender gender;
    private LocalDate dateOfBirth;
    private String phone;
    private Integer age; // computed from dateOfBirth
    private String email;
    private String idNumber;
    private String address;
    private String nextOfKinName;
    private String nextOfKinPhone;
    private String nextOfKinRelationship;
    private String allergies;
    private String bloodGroup;
    private Long insuranceCompanyId;
    private String insuranceCompanyName;
    private String insuranceMemberNumber;
}
