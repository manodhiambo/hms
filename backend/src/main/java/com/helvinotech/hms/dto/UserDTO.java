package com.helvinotech.hms.dto;

import com.helvinotech.hms.enums.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UserDTO {
    private Long id;
    @NotBlank
    private String fullName;
    @NotBlank @Email
    private String email;
    private String password;
    private String plainPassword;
    private String phone;
    @NotNull
    private UserRole role;
    private String department;
    private String specialization;
    private String licenseNumber;
    private boolean active;
}
