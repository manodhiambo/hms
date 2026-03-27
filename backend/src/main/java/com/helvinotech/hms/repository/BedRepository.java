package com.helvinotech.hms.repository;

import com.helvinotech.hms.entity.Bed;
import com.helvinotech.hms.enums.BedStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BedRepository extends JpaRepository<Bed, Long> {
    List<Bed> findByRoomId(Long roomId);

    // Tenant-scoped via ward join
    @Query("SELECT b FROM Bed b WHERE b.room.ward.hospitalId = :hospitalId AND b.status = :status")
    List<Bed> findByHospitalIdAndStatus(@Param("hospitalId") Long hospitalId, @Param("status") BedStatus status);

    @Query("SELECT COUNT(b) FROM Bed b WHERE b.room.ward.hospitalId = :hospitalId AND b.status = :status")
    long countByHospitalIdAndStatus(@Param("hospitalId") Long hospitalId, @Param("status") BedStatus status);

    @Query("SELECT COUNT(b) FROM Bed b WHERE b.room.ward.hospitalId = :hospitalId")
    long countByHospitalId(@Param("hospitalId") Long hospitalId);

    // Legacy
    List<Bed> findByStatus(BedStatus status);
    long countByStatus(BedStatus status);
}
