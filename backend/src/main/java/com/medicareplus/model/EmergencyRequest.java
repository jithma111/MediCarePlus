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
    public enum Stage { ASSIGNED, ON_ROUTE, ARRIVED, AT_HOSPITAL }

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

    @Column private Double latitude;
    @Column private Double longitude;
    @ManyToOne @JoinColumn(name = "driver_id") private User driver;
    @Enumerated(EnumType.STRING)
    @Column(name = "trip_stage", columnDefinition = "VARCHAR(20)") private Stage stage;
    @Column(name = "driver_lat") private Double driverLat;
    @Column(name = "driver_lng") private Double driverLng;
    @Column(name = "driver_notes", length = 500) private String driverNotes;
    @Column(name = "assigned_at") private LocalDateTime assignedAt;
    @Column(name = "on_route_at") private LocalDateTime onRouteAt;
    @Column(name = "arrived_at") private LocalDateTime arrivedAt;
    @Column(name = "at_hospital_at") private LocalDateTime atHospitalAt;

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

    public Double getLatitude() { return latitude; }
    public Double getLongitude() { return longitude; }
    public void setPosition(Double lat, Double lng) { this.latitude = lat; this.longitude = lng; }
    public User getDriver() { return driver; }
    public Stage getStage() { return stage; }
    public Double getDriverLat() { return driverLat; }
    public Double getDriverLng() { return driverLng; }
    public void setDriverPosition(Double lat, Double lng) { this.driverLat = lat; this.driverLng = lng; }
    public String getDriverNotes() { return driverNotes; }
    public void setDriverNotes(String n) { this.driverNotes = n; }
    public LocalDateTime getAssignedAt() { return assignedAt; }
    public LocalDateTime getOnRouteAt() { return onRouteAt; }
    public LocalDateTime getArrivedAt() { return arrivedAt; }
    public LocalDateTime getAtHospitalAt() { return atHospitalAt; }

    public void assignTo(User driver) {
        this.driver = driver;
        this.status = Status.IN_PROGRESS;
        moveTo(Stage.ASSIGNED);
    }

    public void moveTo(Stage next) {
        LocalDateTime now = LocalDateTime.now();
        this.stage = next;
        switch (next) {
            case ASSIGNED -> assignedAt = now;
            case ON_ROUTE -> onRouteAt = now;
            case ARRIVED -> arrivedAt = now;
            case AT_HOSPITAL -> { atHospitalAt = now; status = Status.RESOLVED; }
        }
    }



}
