package com.medicareplus.dto;

import com.medicareplus.model.Appointment;
import com.medicareplus.model.Doctor;
import com.medicareplus.model.Notification;
import com.medicareplus.model.User;

import java.time.LocalDateTime;
import java.util.List;

/** Request and response bodies for the REST API. */
public final class Dtos {

    private Dtos() {
    }

    // ---------- auth ----------
    public record LoginRequest(String email, String password) {
    }

    public record RegisterRequest(String name, String email, String password) {
    }

    public record UserDto(Long id, String email, String name, String role, Long doctorId) {
        public static UserDto of(User u) {
            return new UserDto(u.getId(), u.getEmail(), u.getName(), u.getRole().json(),
                    u.getDoctor() == null ? null : u.getDoctor().getId());
        }
    }

    public record AuthResponse(String token, UserDto user) {
    }

    // ---------- doctors ----------
    public record DoctorDto(Long id, String name, String specialty, String hospital, int yearsExperience,
                            String qualifications, String bio, List<Integer> availableDays) {
        public static DoctorDto of(Doctor d) {
            return new DoctorDto(d.getId(), d.getName(), d.getSpecialty(), d.getHospital(), d.getYearsExperience(),
                    d.getQualifications(), d.getBio(), d.getAvailableDays().stream().sorted().toList());
        }
    }

    public record DoctorRequest(String name, String specialty, String hospital, Integer yearsExperience,
                                String qualifications, String bio, List<Integer> availableDays,
                                String email, String password) {
    }

    /** A taken slot - contains no personal data, so it is safe to expose publicly. */
    public record BookedSlotDto(Long id, String date, String time) {
    }

    // ---------- appointments ----------
    public record AppointmentRequest(Long doctorId, String date, String time, String reason) {
    }

    public record RescheduleRequest(String date, String time) {
    }

    public record StatusRequest(String status) {
    }

    public record AppointmentDto(Long id, Long doctorId, String doctorName, String patientEmail, String patientName,
                                 String date, String time, String reason, String status) {
        public static AppointmentDto of(Appointment a) {
            return new AppointmentDto(a.getId(), a.getDoctor().getId(), a.getDoctor().getName(),
                    a.getPatient().getEmail(), a.getPatient().getName(),
                    a.getApptDate().toString(), a.getApptTime().toString(), a.getReason(), a.getStatus().label());
        }
    }

    // ---------- notifications / admin / contact ----------
    public record NotificationDto(Long id, String text, boolean read, LocalDateTime createdAt) {
        public static NotificationDto of(Notification n) {
            return new NotificationDto(n.getId(), n.getMessage(), n.isSeen(), n.getCreatedAt());
        }
    }

    public record StatsDto(long patients) {
    }

    public record ContactRequest(String name, String email, String message) {
    }
}
