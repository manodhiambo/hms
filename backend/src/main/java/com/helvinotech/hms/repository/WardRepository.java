package com.helvinotech.hms.repository;

import com.helvinotech.hms.entity.Ward;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WardRepository extends JpaRepository<Ward, Long> {
    java.util.Optional<Ward> findByIdAndHospitalId(Long id, Long hospitalId);
    List<Ward> findByHospitalIdAndActiveTrue(Long hospitalId);
    List<Ward> findByHospitalId(Long hospitalId);

    // Legacy
    List<Ward> findByActiveTrue();
}
