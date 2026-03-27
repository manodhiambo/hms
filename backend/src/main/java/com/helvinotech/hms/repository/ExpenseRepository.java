package com.helvinotech.hms.repository;

import com.helvinotech.hms.entity.Expense;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    // Tenant-scoped
    Page<Expense> findByHospitalId(Long hospitalId, Pageable pageable);
    Page<Expense> findByHospitalIdAndExpenseDateBetween(Long hospitalId, LocalDate start, LocalDate end, Pageable pageable);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.hospitalId = :hospitalId AND e.expenseDate BETWEEN :start AND :end")
    BigDecimal sumExpensesByDateRange(@Param("hospitalId") Long hospitalId, @Param("start") LocalDate start, @Param("end") LocalDate end);

    // Legacy
    Page<Expense> findByExpenseDateBetween(LocalDate start, LocalDate end, Pageable pageable);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.expenseDate BETWEEN :start AND :end")
    BigDecimal sumExpensesByDateRange(@Param("start") LocalDate start, @Param("end") LocalDate end);

    @Modifying
    @Query("UPDATE Expense e SET e.recordedBy = null WHERE e.recordedBy.id = :userId")
    void nullifyRecordedBy(@Param("userId") Long userId);
}
