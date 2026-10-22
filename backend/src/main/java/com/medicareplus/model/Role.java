package com.medicareplus.model;

public enum Role {
    PATIENT {
        @Override public String dashboardTitle() { return "Patient dashboard"; }
        @Override public boolean canManageDoctors() { return false; }
    },
    DOCTOR {
        @Override public String dashboardTitle() { return "Doctor dashboard"; }
        @Override public boolean canManageDoctors() { return false; }
    },
    ADMIN {
        @Override public String dashboardTitle() { return "Admin dashboard"; }
        @Override public boolean canManageDoctors() { return true; }
    };

    /** Each role writes its own version of these methods (polymorphism). */
    public abstract String dashboardTitle();
    public abstract boolean canManageDoctors();

    /** Lower-case name used by the front end ("patient", "doctor", "admin"). */
    public String json() {
        return name().toLowerCase();
    }
}