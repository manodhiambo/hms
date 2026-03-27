package com.helvinotech.hms.repository;

import com.helvinotech.hms.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByBillingId(Long billingId);
    void deleteByBillingId(Long billingId);

    // Tenant-scoped
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.hospitalId = :hospitalId AND p.createdAt BETWEEN :start AND :end")
    BigDecimal sumPaymentsByDateRange(@Param("hospitalId") Long hospitalId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT p.paymentMethod, COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.hospitalId = :hospitalId AND p.createdAt BETWEEN :start AND :end GROUP BY p.paymentMethod")
    List<Object[]> sumByMethodInRange(@Param("hospitalId") Long hospitalId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    // Legacy
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.createdAt BETWEEN :start AND :end")
    BigDecimal sumPaymentsByDateRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT p.paymentMethod, COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.createdAt BETWEEN :start AND :end GROUP BY p.paymentMethod")
    List<Object[]> sumByMethodInRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
