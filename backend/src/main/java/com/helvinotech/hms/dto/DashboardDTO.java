package com.helvinotech.hms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardDTO {
    private long patientsToday;
    private long totalPatients;
    private long appointmentsToday;
    private long visitsToday;
    private BigDecimal revenueToday;
    private BigDecimal revenueThisMonth;
    private long pendingLabOrders;
    private long pendingBills;
    private long occupiedBeds;
    private long availableBeds;
    private long totalBeds;
    private double bedOccupancyRate;
    private List<DrugDTO> lowStockDrugs;
    private Map<String, Long> departmentVisits;
}
