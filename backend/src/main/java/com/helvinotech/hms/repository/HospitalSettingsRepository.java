package com.helvinotech.hms.repository;

import com.helvinotech.hms.entity.HospitalSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HospitalSettingsRepository extends JpaRepository<HospitalSettings, Long> {
}
