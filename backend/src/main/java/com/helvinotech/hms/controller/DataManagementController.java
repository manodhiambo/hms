package com.helvinotech.hms.controller;

import com.helvinotech.hms.dto.ApiResponse;
import com.helvinotech.hms.service.ActivityLogService;
import com.helvinotech.hms.service.DataManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/data")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class DataManagementController {

    private final DataManagementService dataManagementService;
    private final ActivityLogService activityLogService;

    @DeleteMapping("/patients")
    public ResponseEntity<ApiResponse<Void>> clearPatients() {
        int count = dataManagementService.clearAllClinicalData();
        activityLogService.logCurrentUser("CLEAR_DATA", "Patient",
                null, "Cleared all clinical data: " + count + " patients and all linked records deleted");
        return ResponseEntity.ok(ApiResponse.success("All patient and clinical data cleared (" + count + " patients removed)", null));
    }

    @DeleteMapping("/wards")
    public ResponseEntity<ApiResponse<Void>> clearWards() {
        int count = dataManagementService.clearWardsAndBeds();
        activityLogService.logCurrentUser("CLEAR_DATA", "Ward",
                null, "Cleared all wards, rooms, beds, and admissions: " + count + " wards deleted");
        return ResponseEntity.ok(ApiResponse.success("All ward and bed data cleared (" + count + " wards removed)", null));
    }

    @DeleteMapping("/billing")
    public ResponseEntity<ApiResponse<Void>> clearBilling() {
        int count = dataManagementService.clearBillingData();
        activityLogService.logCurrentUser("CLEAR_DATA", "Billing",
                null, "Cleared all billing data: " + count + " invoices deleted");
        return ResponseEntity.ok(ApiResponse.success("All billing data cleared (" + count + " invoices removed)", null));
    }

    @DeleteMapping("/appointments")
    public ResponseEntity<ApiResponse<Void>> clearAppointments() {
        int count = dataManagementService.clearAppointments();
        activityLogService.logCurrentUser("CLEAR_DATA", "Appointment",
                null, "Cleared all appointments: " + count + " records deleted");
        return ResponseEntity.ok(ApiResponse.success("All appointments cleared (" + count + " records removed)", null));
    }

    @DeleteMapping("/expenses")
    public ResponseEntity<ApiResponse<Void>> clearExpenses() {
        int count = dataManagementService.clearExpenses();
        activityLogService.logCurrentUser("CLEAR_DATA", "Expense",
                null, "Cleared all expenses: " + count + " records deleted");
        return ResponseEntity.ok(ApiResponse.success("All expenses cleared (" + count + " records removed)", null));
    }

    @DeleteMapping("/patients/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePatient(@PathVariable Long id) {
        dataManagementService.deletePatient(id);
        activityLogService.logCurrentUser("DELETE_RECORD", "Patient", id, "Deleted patient ID: " + id + " and all linked records");
        return ResponseEntity.ok(ApiResponse.success("Patient and all linked records deleted", null));
    }

    @DeleteMapping("/billing/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteBilling(@PathVariable Long id) {
        dataManagementService.deleteBilling(id);
        activityLogService.logCurrentUser("DELETE_RECORD", "Billing", id, "Deleted billing ID: " + id);
        return ResponseEntity.ok(ApiResponse.success("Billing record deleted", null));
    }
}
