package com.medicareplus.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "emergencies")
public class EmergencyRequest {

    /** Each severity level states its own response target (polymorphism). */
    public enum Severity {
        LOW { @Override public int targetMinutes() { return 120; } },
        HIGH { @Override public int targetMinutes() { return 30; } },
        CRITICAL { @Override public int targetMinutes() { return 5; } };

        public abstract int targetMinutes();
    }

    public enum Status { OPEN, IN_PROGRESS, RESOLVED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private User patient;

    @Column(nullable = false, length = 30)
    private String phone;

    @Column(nullable = false, length = 255)
    private String location;

    @Column(nullable = false, length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Severity severity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.OPEN;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public EmergencyRequest() { }

    public EmergencyRequest(User patient, String phone, String location, String description, Severity severity) {
        this.patient = patient;
        this.phone = phone;
        this.location = location;
        this.description = description;
        this.severity = severity;
    }

    public Long getId() { return id; }
    public User getPatient() { return patient; }
    public String getPhone() { return phone; }
    public String getLocation() { return location; }
    public String getDescription() { return description; }
    public Severity getSeverity() { return severity; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
