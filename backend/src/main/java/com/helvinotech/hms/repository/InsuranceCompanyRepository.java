package com.helvinotech.hms.repository;

import com.helvinotech.hms.entity.InsuranceCompany;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InsuranceCompanyRepository extends JpaRepository<InsuranceCompany, Long> {
    // Tenant-scoped
    Optional<InsuranceCompany> findByNameAndHospitalId(String name, Long hospitalId);
    List<InsuranceCompany> findByHospitalIdAndActiveTrue(Long hospitalId);
    List<InsuranceCompany> findByHospitalId(Long hospitalId);

    // Legacy
    Optional<InsuranceCompany> findByName(String name);
    List<InsuranceCompany> findByActiveTrue();
}
