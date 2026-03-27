package com.helvinotech.hms.repository;

import com.helvinotech.hms.entity.LabTest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LabTestRepository extends JpaRepository<LabTest, Long> {
    // Tenant-scoped
    List<LabTest> findByHospitalIdAndCategory(Long hospitalId, String category);
    List<LabTest> findByHospitalIdAndActiveTrue(Long hospitalId);

    // Legacy
    List<LabTest> findByCategory(String category);
    List<LabTest> findByActiveTrue();
}
