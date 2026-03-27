package com.helvinotech.hms.repository;

import com.helvinotech.hms.entity.ActivityLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
    Page<ActivityLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
    Page<ActivityLog> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    @Query("SELECT a FROM ActivityLog a WHERE " +
           "(:userId IS NULL OR a.user.id = :userId) AND " +
           "(:action IS NULL OR LOWER(a.action) LIKE LOWER(CONCAT('%', :action, '%'))) AND " +
           "(:start IS NULL OR a.createdAt >= :start) AND " +
           "(:end IS NULL OR a.createdAt <= :end) " +
           "ORDER BY a.createdAt DESC")
    Page<ActivityLog> findByFilters(
            @Param("userId") Long userId,
            @Param("action") String action,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            Pageable pageable);

    @Modifying
    @Query("UPDATE ActivityLog a SET a.user = null WHERE a.user.id = :userId")
    void nullifyUser(@Param("userId") Long userId);
}
