package com.helvinotech.hms.tenant;

public class TenantContext {

    private static final ThreadLocal<Long> CURRENT_HOSPITAL_ID = new ThreadLocal<>();

    public static Long getCurrentHospitalId() {
        return CURRENT_HOSPITAL_ID.get();
    }

    public static void setCurrentHospitalId(Long hospitalId) {
        CURRENT_HOSPITAL_ID.set(hospitalId);
    }

    public static void clear() {
        CURRENT_HOSPITAL_ID.remove();
    }
}
