package com.helvinotech.hms.repository;

import com.helvinotech.hms.entity.Refund;
import com.helvinotech.hms.enums.RefundStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RefundRepository extends JpaRepository<Refund, Long> {
    // Tenant-scoped
    Page<Refund> findByHospitalIdOrderByCreatedAtDesc(Long hospitalId, Pageable pageable);
    List<Refund> findByHospitalIdAndPatientIdOrderByCreatedAtDesc(Long hospitalId, Long patientId);
    Page<Refund> findByHospitalIdAndStatusOrderByCreatedAtDesc(Long hospitalId, RefundStatus status, Pageable pageable);

    // Legacy
    Page<Refund> findAllByOrderByCreatedAtDesc(Pageable pageable);
    List<Refund> findByPatientIdOrderByCreatedAtDesc(Long patientId);
    Page<Refund> findByStatusOrderByCreatedAtDesc(RefundStatus status, Pageable pageable);
    boolean existsByPrescriptionIdAndStatusNot(Long prescriptionId, RefundStatus status);
}
