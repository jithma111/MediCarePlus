package com.medicareplus.model;

public enum Role {
    PATIENT, DOCTOR, ADMIN;

    /** Lower-case name used by the front end ("patient", "doctor", "admin"). */
    public String json() {
        return name().toLowerCase();
    }
}
