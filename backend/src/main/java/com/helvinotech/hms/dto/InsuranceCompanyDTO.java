package com.helvinotech.hms.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class InsuranceCompanyDTO {
    private Long id;
    @NotBlank
    private String name;
    private String contactPerson;
    private String phone;
    private String email;
    private String address;
    private boolean active;
}
