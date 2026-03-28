package com.helvinotech.hms.repository;

import com.helvinotech.hms.entity.ImagingOrder;
import com.helvinotech.hms.enums.LabOrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ImagingOrderRepository extends JpaRepository<ImagingOrder, Long> {
    List<ImagingOrder> findByVisitId(Long visitId);

    // Tenant-scoped
    java.util.Optional<ImagingOrder> findByIdAndHospitalId(Long id, Long hospitalId);
    Page<ImagingOrder> findByHospitalId(Long hospitalId, Pageable pageable);
    Page<ImagingOrder> findByHospitalIdAndStatus(Long hospitalId, LabOrderStatus status, Pageable pageable);

    @Query("SELECT COUNT(io) FROM ImagingOrder io WHERE io.hospitalId = :hospitalId AND io.createdAt BETWEEN :start AND :end")
    long countInRange(@Param("hospitalId") Long hospitalId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT io.imagingType, COUNT(io) FROM ImagingOrder io WHERE io.hospitalId = :hospitalId AND io.createdAt BETWEEN :start AND :end GROUP BY io.imagingType ORDER BY COUNT(io) DESC")
    List<Object[]> countByTypeInRange(@Param("hospitalId") Long hospitalId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    // Legacy
    Page<ImagingOrder> findByStatus(LabOrderStatus status, Pageable pageable);

    @Query("SELECT COUNT(io) FROM ImagingOrder io WHERE io.createdAt BETWEEN :start AND :end")
    long countInRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT io.imagingType, COUNT(io) FROM ImagingOrder io WHERE io.createdAt BETWEEN :start AND :end GROUP BY io.imagingType ORDER BY COUNT(io) DESC")
    List<Object[]> countByTypeInRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Modifying
    @Query("UPDATE ImagingOrder io SET io.radiologist = null WHERE io.radiologist.id = :userId")
    void nullifyRadiologist(@Param("userId") Long userId);

    void deleteByVisitId(Long visitId);
}
