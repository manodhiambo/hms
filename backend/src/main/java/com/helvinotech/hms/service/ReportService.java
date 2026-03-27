package com.helvinotech.hms.service;

import com.helvinotech.hms.enums.AdmissionStatus;
import com.helvinotech.hms.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportService {

    private final BillingRepository billingRepository;
    private final PaymentRepository paymentRepository;
    private final ExpenseRepository expenseRepository;
    private final PatientRepository patientRepository;
    private final VisitRepository visitRepository;
    private final LabOrderRepository labOrderRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final ImagingOrderRepository imagingOrderRepository;
    private final AdmissionRepository admissionRepository;

    public Map<String, Object> getFinancialReport(LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.plusDays(1).atStartOfDay();

        BigDecimal revenue = billingRepository.sumRevenueByDateRange(start, end);
        BigDecimal payments = paymentRepository.sumPaymentsByDateRange(start, end);
        BigDecimal expenses = expenseRepository.sumExpensesByDateRange(startDate, endDate);

        Map<String, Object> report = new LinkedHashMap<>();
        report.put("startDate", startDate);
        report.put("endDate", endDate);
        report.put("totalRevenue", revenue);
        report.put("totalPayments", payments);
        report.put("totalExpenses", expenses);
        report.put("netIncome", payments.subtract(expenses));
        report.put("byMethod", buildByMethodMap(start, end));
        return report;
    }

    public Map<String, Object> getRevenueReport(LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.plusDays(1).atStartOfDay();

        Map<String, BigDecimal> byMethod = buildByMethodMap(start, end);
        BigDecimal total = byMethod.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> report = new LinkedHashMap<>();
        report.put("startDate", startDate);
        report.put("endDate", endDate);
        report.put("total", total);
        report.put("byMethod", byMethod);
        return report;
    }

    private Map<String, BigDecimal> buildByMethodMap(LocalDateTime start, LocalDateTime end) {
        Map<String, BigDecimal> byMethod = new LinkedHashMap<>();
        for (String m : new String[]{"CASH", "MPESA", "CARD", "BANK_TRANSFER", "INSURANCE", "DONATION"}) {
            byMethod.put(m, BigDecimal.ZERO);
        }
        for (Object[] row : paymentRepository.sumByMethodInRange(start, end)) {
            byMethod.put(row[0].toString(), (BigDecimal) row[1]);
        }
        return byMethod;
    }

    public Map<String, Object> getPatientReport(LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.plusDays(1).atStartOfDay();

        Map<String, Object> report = new HashMap<>();
        report.put("startDate", startDate);
        report.put("endDate", endDate);
        report.put("newPatients", patientRepository.countByCreatedAtBetween(start, end));
        report.put("totalVisits", visitRepository.countByCreatedAtBetween(start, end));
        return report;
    }

    public Map<String, Object> getMohReport(LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.plusDays(1).atStartOfDay();

        Map<String, Object> report = new LinkedHashMap<>();
        report.put("startDate", startDate.toString());
        report.put("endDate", endDate.toString());

        // ── OUTPATIENT ATTENDANCE ──
        long totalVisits = visitRepository.countByCreatedAtBetween(start, end);
        long newAttendances = visitRepository.countNewPatientVisitsInRange(start, end);
        long reAttendances = totalVisits - newAttendances;

        Map<String, Long> byGender = new LinkedHashMap<>();
        byGender.put("MALE", 0L); byGender.put("FEMALE", 0L); byGender.put("OTHER", 0L);
        for (Object[] row : visitRepository.countByGenderInRange(start, end)) {
            byGender.put(row[0].toString(), ((Number) row[1]).longValue());
        }

        Map<String, Long> byVisitType = new LinkedHashMap<>();
        byVisitType.put("OPD", 0L); byVisitType.put("EMERGENCY", 0L); byVisitType.put("IPD", 0L);
        for (Object[] row : visitRepository.countByVisitTypeInRange(start, end)) {
            byVisitType.put(row[0].toString(), ((Number) row[1]).longValue());
        }

        // Age groups from patient DOBs
        List<LocalDate> dobs = visitRepository.findPatientDobsInRange(start, end);
        Map<String, Long> byAgeGroup = new LinkedHashMap<>();
        byAgeGroup.put("Under 1 year", 0L);
        byAgeGroup.put("1 - 4 years", 0L);
        byAgeGroup.put("5 - 14 years", 0L);
        byAgeGroup.put("15 - 59 years", 0L);
        byAgeGroup.put("60+ years", 0L);
        LocalDate today = LocalDate.now();
        for (LocalDate dob : dobs) {
            int age = Period.between(dob, today).getYears();
            if (age < 1) byAgeGroup.merge("Under 1 year", 1L, Long::sum);
            else if (age < 5) byAgeGroup.merge("1 - 4 years", 1L, Long::sum);
            else if (age < 15) byAgeGroup.merge("5 - 14 years", 1L, Long::sum);
            else if (age < 60) byAgeGroup.merge("15 - 59 years", 1L, Long::sum);
            else byAgeGroup.merge("60+ years", 1L, Long::sum);
        }

        Map<String, Object> outpatient = new LinkedHashMap<>();
        outpatient.put("total", totalVisits);
        outpatient.put("newAttendances", newAttendances);
        outpatient.put("reAttendances", reAttendances);
        outpatient.put("byGender", byGender);
        outpatient.put("byVisitType", byVisitType);
        outpatient.put("byAgeGroup", byAgeGroup);
        report.put("outpatient", outpatient);

        // ── INPATIENT STATISTICS ──
        long admissionsInPeriod = admissionRepository.countInRange(start, end);
        long dischargesInPeriod = admissionRepository.countDischargedInRange(start, end);
        long currentInpatients = admissionRepository.countByStatus(AdmissionStatus.ADMITTED);

        Map<String, Object> inpatient = new LinkedHashMap<>();
        inpatient.put("admissions", admissionsInPeriod);
        inpatient.put("discharges", dischargesInPeriod);
        inpatient.put("currentInpatients", currentInpatients);
        report.put("inpatient", inpatient);

        // ── MORBIDITY TOP 10 ──
        List<Object[]> morbRows = visitRepository.getMorbidityData(start, end);
        List<Map<String, Object>> morbidity = new ArrayList<>();
        int rank = 1;
        long totalCases = morbRows.stream().mapToLong(r -> ((Number) r[2]).longValue()).sum();
        for (Object[] row : morbRows) {
            if (rank > 10) break;
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("rank", rank++);
            entry.put("diagnosis", row[0]);
            entry.put("diagnosisCode", row[1]);
            long count = ((Number) row[2]).longValue();
            entry.put("count", count);
            entry.put("percent", totalCases > 0 ? Math.round((count * 1000.0 / totalCases)) / 10.0 : 0.0);
            morbidity.add(entry);
        }
        report.put("morbidity", morbidity);
        report.put("totalDiagnosedCases", totalCases);

        // ── LABORATORY SERVICES ──
        long labTotal = labOrderRepository.countInRange(start, end);
        long labCompleted = labOrderRepository.countCompletedInRange(start, end);
        long labAbnormal = labOrderRepository.countAbnormalInRange(start, end);

        Map<String, Long> byTestCategory = new LinkedHashMap<>();
        for (Object[] row : labOrderRepository.countByTestCategoryInRange(start, end)) {
            byTestCategory.put(row[0] != null ? row[0].toString() : "Uncategorised", ((Number) row[1]).longValue());
        }

        Map<String, Object> laboratory = new LinkedHashMap<>();
        laboratory.put("totalOrders", labTotal);
        laboratory.put("completed", labCompleted);
        laboratory.put("abnormal", labAbnormal);
        laboratory.put("normalResults", labCompleted - labAbnormal);
        laboratory.put("byCategory", byTestCategory);
        report.put("laboratory", laboratory);

        // ── IMAGING SERVICES ──
        long imagingTotal = imagingOrderRepository.countInRange(start, end);
        Map<String, Long> byImagingType = new LinkedHashMap<>();
        for (Object[] row : imagingOrderRepository.countByTypeInRange(start, end)) {
            byImagingType.put(row[0].toString(), ((Number) row[1]).longValue());
        }

        Map<String, Object> imaging = new LinkedHashMap<>();
        imaging.put("total", imagingTotal);
        imaging.put("byType", byImagingType);
        report.put("imaging", imaging);

        // ── PHARMACY SERVICES ──
        long rxTotal = prescriptionRepository.countInRange(start, end);
        long rxDispensed = prescriptionRepository.countDispensedInRange(start, end);

        Map<String, Object> pharmacy = new LinkedHashMap<>();
        pharmacy.put("totalPrescriptions", rxTotal);
        pharmacy.put("dispensed", rxDispensed);
        pharmacy.put("pending", rxTotal - rxDispensed);
        report.put("pharmacy", pharmacy);

        // ── FINANCIAL SUMMARY ──
        BigDecimal totalBilled = billingRepository.sumRevenueByDateRange(start, end);
        BigDecimal totalCollected = paymentRepository.sumPaymentsByDateRange(start, end);
        BigDecimal totalExpenses = expenseRepository.sumExpensesByDateRange(startDate, endDate);

        Map<String, Object> financial = new LinkedHashMap<>();
        financial.put("totalBilled", totalBilled);
        financial.put("totalCollected", totalCollected);
        financial.put("totalExpenses", totalExpenses);
        financial.put("netIncome", totalCollected.subtract(totalExpenses));
        report.put("financial", financial);

        return report;
    }

    public List<Map<String, Object>> getMorbidityReport(LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.plusDays(1).atStartOfDay();

        List<Object[]> rows = visitRepository.getMorbidityData(start, end);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : rows) {
            Map<String, Object> entry = new HashMap<>();
            entry.put("diagnosis", row[0]);
            entry.put("diagnosisCode", row[1]);
            entry.put("count", row[2]);
            result.add(entry);
        }
        return result;
    }
}
