package com.helvinotech.hms.repository;

import com.helvinotech.hms.entity.Hospital;
import com.helvinotech.hms.enums.SubscriptionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface HospitalRepository extends JpaRepository<Hospital, Long> {
    Optional<Hospital> findBySlug(String slug);
    boolean existsBySlug(String slug);
    boolean existsByEmail(String email);

    /** Find all hospitals whose trial period has expired but are still in TRIAL status */
    @Query("SELECT h FROM Hospital h WHERE h.subscriptionStatus = :status AND h.trialEndsAt < :now")
    List<Hospital> findExpiredTrials(@Param("status") SubscriptionStatus status, @Param("now") LocalDateTime now);
}
