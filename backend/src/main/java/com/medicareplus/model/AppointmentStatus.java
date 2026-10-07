package com.medicareplus.model;

import com.medicareplus.exception.ApiException;

public enum AppointmentStatus {
    PENDING("Pending"),
    CONFIRMED("Confirmed"),
    COMPLETED("Completed"),
    CANCELLED("Cancelled");

    private final String label;

    AppointmentStatus(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }

    /** Pending or Confirmed: the appointment can still change. */
    public boolean isActive() {
        return this == PENDING || this == CONFIRMED;
    }

    public static AppointmentStatus fromLabel(String s) {
        if (s != null) {
            for (AppointmentStatus v : values()) {
                if (v.label.equalsIgnoreCase(s.trim())) {
                    return v;
                }
            }
        }
        throw new ApiException(400, "Unknown appointment status.");
    }
}
