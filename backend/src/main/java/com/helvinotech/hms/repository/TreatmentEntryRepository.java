package com.helvinotech.hms.repository;

import com.helvinotech.hms.entity.TreatmentEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TreatmentEntryRepository extends JpaRepository<TreatmentEntry, Long> {
    List<TreatmentEntry> findByAdmissionIdOrderByCreatedAtDesc(Long admissionId);
    void deleteByAdmission_Id(Long admissionId);
}
