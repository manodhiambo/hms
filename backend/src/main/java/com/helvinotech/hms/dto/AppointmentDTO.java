package com.helvinotech.hms.dto;

import com.helvinotech.hms.enums.AppointmentStatus;
import com.helvinotech.hms.enums.AppointmentType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
public class AppointmentDTO {
    private Long id;
    @NotNull
    private Long patientId;
    private String patientName;
    @NotNull
    private Long doctorId;
    private String doctorName;
    private String department;
    @NotNull
    private LocalDate appointmentDate;
    @NotNull
    private LocalTime appointmentTime;
    private AppointmentType appointmentType;
    private AppointmentStatus status;
    private String notes;
    private boolean walkIn;
    private LocalDateTime createdAt;
}
