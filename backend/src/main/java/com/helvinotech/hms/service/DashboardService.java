package com.helvinotech.hms.service;

import com.helvinotech.hms.dto.DashboardDTO;
import com.helvinotech.hms.dto.DrugDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private final PatientService patientService;
    private final VisitService visitService;
    private final AppointmentService appointmentService;
    private final BillingService billingService;
    private final LabService labService;
    private final WardService wardService;
    private final PharmacyService pharmacyService;

    public DashboardDTO getDashboard() {
        long totalBeds = wardService.countTotalBeds();
        long occupiedBeds = wardService.countOccupiedBeds();
        long availableBeds = wardService.countAvailableBeds();
        double occupancyRate = totalBeds > 0 ? (double) occupiedBeds / totalBeds * 100 : 0;

        List<DrugDTO> lowStockDrugs = pharmacyService.getLowStockDrugs();

        return DashboardDTO.builder()
                .patientsToday(patientService.countPatientsToday())
                .totalPatients(0) // could add count
                .appointmentsToday(appointmentService.countTodayAppointments())
                .visitsToday(visitService.countVisitsToday())
                .revenueToday(billingService.getRevenueToday())
                .revenueThisMonth(billingService.getRevenueThisMonth())
                .pendingLabOrders(labService.countPendingOrders())
                .occupiedBeds(occupiedBeds)
                .availableBeds(availableBeds)
                .totalBeds(totalBeds)
                .bedOccupancyRate(BigDecimal.valueOf(occupancyRate).setScale(1, RoundingMode.HALF_UP).doubleValue())
                .lowStockDrugs(lowStockDrugs)
                .build();
    }
}
