package com.helvinotech.hms.enums;

public enum TriageStatus {
    WAITING,             // Registered, waiting to be triaged by nurse
    TRIAGED,             // Triaged, in queue for doctor
    IN_CONSULTATION,     // Currently with doctor
    PENDING_LAB_REVIEW,  // Lab results returned, doctor must review
    COMPLETED            // Visit completed
}
