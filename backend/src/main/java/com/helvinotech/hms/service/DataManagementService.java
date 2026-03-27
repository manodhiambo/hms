package com.helvinotech.hms.service;

import com.helvinotech.hms.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DataManagementService {

    private final NursingNoteRepository nursingNoteRepository;
    private final ImagingOrderRepository imagingOrderRepository;
    private final LabOrderRepository labOrderRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final BillingItemRepository billingItemRepository;
    private final PaymentRepository paymentRepository;
    private final InsuranceClaimRepository insuranceClaimRepository;
    private final BillingRepository billingRepository;
    private final AdmissionRepository admissionRepository;
    private final VisitRepository visitRepository;
    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final BedRepository bedRepository;
    private final RoomRepository roomRepository;
    private final WardRepository wardRepository;
    private final ExpenseRepository expenseRepository;

    /** Clear all patient records and everything clinically linked to them. */
    @Transactional
    public int clearAllClinicalData() {
        // Delete in FK dependency order (children first)
        nursingNoteRepository.deleteAllInBatch();
        imagingOrderRepository.deleteAllInBatch();
        labOrderRepository.deleteAllInBatch();
        prescriptionRepository.deleteAllInBatch();
        billingItemRepository.deleteAllInBatch();
        paymentRepository.deleteAllInBatch();
        insuranceClaimRepository.deleteAllInBatch();
        billingRepository.deleteAllInBatch();
        admissionRepository.deleteAllInBatch();
        visitRepository.deleteAllInBatch();
        appointmentRepository.deleteAllInBatch();
        long count = patientRepository.count();
        patientRepository.deleteAllInBatch();
        return (int) count;
    }

    /** Clear all ward, room, and bed records (along with admissions and nursing notes referencing them). */
    @Transactional
    public int clearWardsAndBeds() {
        nursingNoteRepository.deleteAllInBatch();
        admissionRepository.deleteAllInBatch();
        bedRepository.deleteAllInBatch();
        roomRepository.deleteAllInBatch();
        long count = wardRepository.count();
        wardRepository.deleteAllInBatch();
        return (int) count;
    }

    /** Clear all billing records (invoices, payments, insurance claims, line items). */
    @Transactional
    public int clearBillingData() {
        billingItemRepository.deleteAllInBatch();
        paymentRepository.deleteAllInBatch();
        insuranceClaimRepository.deleteAllInBatch();
        long count = billingRepository.count();
        billingRepository.deleteAllInBatch();
        return (int) count;
    }

    /** Clear all appointments. */
    @Transactional
    public int clearAppointments() {
        long count = appointmentRepository.count();
        appointmentRepository.deleteAllInBatch();
        return (int) count;
    }

    /** Clear all expense records. */
    @Transactional
    public int clearExpenses() {
        long count = expenseRepository.count();
        expenseRepository.deleteAllInBatch();
        return (int) count;
    }

    /** Delete a specific patient and all clinically linked records. */
    @Transactional
    public void deletePatient(Long patientId) {
        if (!patientRepository.existsById(patientId)) {
            throw new com.helvinotech.hms.exception.ResourceNotFoundException("Patient", patientId);
        }
        // Delete child records in FK dependency order
        java.util.List<com.helvinotech.hms.entity.Visit> visits = visitRepository.findByPatientId(patientId);
        for (com.helvinotech.hms.entity.Visit visit : visits) {
            nursingNoteRepository.deleteByAdmission_Visit_Id(visit.getId());
            imagingOrderRepository.deleteByVisitId(visit.getId());
            labOrderRepository.deleteByVisitId(visit.getId());
            prescriptionRepository.deleteByVisitId(visit.getId());
        }
        // Delete billing linked to this patient
        java.util.List<com.helvinotech.hms.entity.Billing> billings = billingRepository.findByPatientId(patientId);
        for (com.helvinotech.hms.entity.Billing billing : billings) {
            billingItemRepository.deleteByBillingId(billing.getId());
            paymentRepository.deleteByBillingId(billing.getId());
            insuranceClaimRepository.deleteByBillingId(billing.getId());
        }
        billingRepository.deleteByPatientId(patientId);
        admissionRepository.deleteByPatientId(patientId);
        visitRepository.deleteByPatientId(patientId);
        appointmentRepository.deleteByPatientId(patientId);
        patientRepository.deleteById(patientId);
    }

    /** Delete a specific billing record and its items/payments. */
    @Transactional
    public void deleteBilling(Long billingId) {
        if (!billingRepository.existsById(billingId)) {
            throw new com.helvinotech.hms.exception.ResourceNotFoundException("Billing", billingId);
        }
        billingItemRepository.deleteByBillingId(billingId);
        paymentRepository.deleteByBillingId(billingId);
        insuranceClaimRepository.deleteByBillingId(billingId);
        billingRepository.deleteById(billingId);
    }
}
