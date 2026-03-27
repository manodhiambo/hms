package com.helvinotech.hms.repository;

import com.helvinotech.hms.entity.MedicalService;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MedicalServiceRepository extends JpaRepository<MedicalService, Long> {
    List<MedicalService> findByActiveTrueOrderByCategory();
    List<MedicalService> findAllByOrderByCategory();
    List<MedicalService> findByServiceNameContainingIgnoreCaseAndActiveTrue(String name);
}
