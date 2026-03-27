package com.helvinotech.hms.entity;

import com.helvinotech.hms.enums.SubscriptionStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "hospitals")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Hospital {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String slug; // URL-safe identifier e.g. "city-general"

    private String email;

    private String phone;

    private String contactPerson;

    private String county;

    @Column(length = 500)
    private String address;

    @Builder.Default
    private boolean active = true;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false)
    private SubscriptionStatus subscriptionStatus = SubscriptionStatus.TRIAL;

    /** When the 5-day trial ends. Set at registration. */
    private LocalDateTime trialEndsAt;

    /** Set when the hospital makes payment and subscription is activated/renewed. */
    private LocalDateTime subscriptionExpiresAt;

    /** Admin notes e.g. payment reference */
    @Column(length = 1000)
    private String notes;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
