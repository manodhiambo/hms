package com.helvinotech.hms.dto;

import com.helvinotech.hms.enums.SubscriptionStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class HospitalDTO {

    private Long id;

    private String name;

    private String slug;

    private String email;

    private String phone;

    private String contactPerson;

    private String county;

    private String address;

    private boolean active;

    private SubscriptionStatus subscriptionStatus;

    private LocalDateTime trialEndsAt;

    private LocalDateTime subscriptionExpiresAt;

    private String notes;

    private LocalDateTime createdAt;

    // For registration: admin user details
    private String adminName;
    private String adminEmail;
    private String adminPassword;
}
