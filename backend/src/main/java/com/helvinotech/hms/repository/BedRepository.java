package com.helvinotech.hms.repository;

import com.helvinotech.hms.entity.Bed;
import com.helvinotech.hms.enums.BedStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BedRepository extends JpaRepository<Bed, Long> {
    List<Bed> findByStatus(BedStatus status);
    List<Bed> findByRoomId(Long roomId);
    long countByStatus(BedStatus status);
}
