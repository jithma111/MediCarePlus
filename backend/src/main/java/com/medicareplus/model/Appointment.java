package com.medicareplus.model;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "appointments",
        indexes = @Index(name = "idx_appt_slot", columnList = "doctor_id, appointment_date, appointment_time"))
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    @ManyToOne(optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private User patient;

    @Column(name = "appointment_date", nullable = false)
    private LocalDate apptDate;

    @Column(name = "appointment_time", nullable = false)
    private LocalTime apptTime;

    @Column(nullable = false, length = 120)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "VARCHAR(20)")
    private AppointmentStatus status = AppointmentStatus.PENDING;

    @Column(name = "patient_reminder_sent", nullable = false)
    private boolean patientReminderSent;

    @Column(name = "doctor_reminder_sent", nullable = false)
    private boolean doctorReminderSent;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Long getId() { return id; }
    public Doctor getDoctor() { return doctor; }
    public void setDoctor(Doctor doctor) { this.doctor = doctor; }
    public User getPatient() { return patient; }
    public void setPatient(User patient) { this.patient = patient; }
    public LocalDate getApptDate() { return apptDate; }
    public void setApptDate(LocalDate apptDate) { this.apptDate = apptDate; }
    public LocalTime getApptTime() { return apptTime; }
    public void setApptTime(LocalTime apptTime) { this.apptTime = apptTime; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public AppointmentStatus getStatus() { return status; }
    public void setStatus(AppointmentStatus status) { this.status = status; }
    public boolean isPatientReminderSent() { return patientReminderSent; }
    public void setPatientReminderSent(boolean v) { this.patientReminderSent = v; }
    public boolean isDoctorReminderSent() { return doctorReminderSent; }
    public void setDoctorReminderSent(boolean v) { this.doctorReminderSent = v; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
