package com.medicareplus.model;

import com.medicareplus.exception.ApiException;

public enum AppointmentStatus {
    PENDING("Pending") {
        @Override public AppointmentStatus[] nextStatuses() { return new AppointmentStatus[]{CONFIRMED, CANCELLED}; }
    },
    CONFIRMED("Confirmed") {
        @Override public AppointmentStatus[] nextStatuses() { return new AppointmentStatus[]{COMPLETED, CANCELLED}; }
    },
    COMPLETED("Completed") {
        @Override public AppointmentStatus[] nextStatuses() { return new AppointmentStatus[0]; }
    },
    CANCELLED("Cancelled") {
        @Override public AppointmentStatus[] nextStatuses() { return new AppointmentStatus[0]; }
    };

    private final String label;

    AppointmentStatus(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }

    /** Each status lists the statuses it may move to (polymorphism). */
    public abstract AppointmentStatus[] nextStatuses();

    /** True if this status is allowed to change to the given one. */
    public boolean canMoveTo(AppointmentStatus next) {
        for (AppointmentStatus s : nextStatuses()) {
            if (s == next) {
                return true;
            }
        }
        return false;
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