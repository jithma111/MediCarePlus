package com.medicareplus.controller;

import com.medicareplus.exception.ApiException;
import com.medicareplus.model.EmergencyRequest;
import com.medicareplus.model.EmergencyRequest.Stage;
import com.medicareplus.model.EmergencyRequest.Status;
import com.medicareplus.model.Role;
import com.medicareplus.model.User;
import com.medicareplus.repository.EmergencyRepository;
import com.medicareplus.security.AuthContext;
import com.medicareplus.service.NotificationService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.Period;
import java.util.Comparator;
import java.util.List;

/**
 * Ambulance driver API.
 * A driver sees the open emergency requests, accepts one (only one active job at a time),
 * moves it through the trip stages and shares the ambulance position with the patient.
 */
@RestController
@RequestMapping("/api/driver")
public class DriverController {

    public record Position(Double latitude, Double longitude) { }
    public record StageUpdate(String stage) { }
    public record Notes(String notes) { }

    /** What the driver needs to reach the patient. Includes the medical conditions the patient put in their profile. */
    public record JobDto(Long id, String patient, Integer patientAge, String patientGender, String phone,
                         String location, Double latitude, Double longitude, String description,
                         String medicalConditions, String severity, int targetMinutes, String status,
                         String stage, String createdAt, String assignedAt, String onRouteAt,
                         String arrivedAt, String atHospitalAt, String notes,
                         Double driverLatitude, Double driverLongitude) { }

    private final EmergencyRepository emergencies;
    private final AuthContext auth;
    private final NotificationService notifications;
    private final Object takeLock = new Object();   // two drivers must not take the same request

    public DriverController(EmergencyRepository emergencies, AuthContext auth, NotificationService notifications) {
        this.emergencies = emergencies;
        this.auth = auth;
        this.notifications = notifications;
    }

    /** Open requests nobody has taken yet: most severe first, then the one waiting longest. */
    @GetMapping("/requests")
    public List<JobDto> open(HttpServletRequest req) {
        auth.require(req, Role.DRIVER);
        return emergencies.findByStatusAndDriverIsNull(Status.OPEN).stream()
                .sorted(Comparator.comparing((EmergencyRequest e) -> e.getSeverity().ordinal(), Comparator.reverseOrder())
                        .thenComparing(EmergencyRequest::getCreatedAt))
                .map(this::toDto).toList();
    }

    /** The job this driver is working on now, or an empty body when they are free. */
    @GetMapping("/active")
    public JobDto active(HttpServletRequest req) {
        User driver = auth.require(req, Role.DRIVER);
        EmergencyRequest e = activeJob(driver);
        return e == null ? null : toDto(e);
    }

    /** All jobs this driver has handled (My Requests). */
    @GetMapping("/mine")
    public List<JobDto> mine(HttpServletRequest req) {
        User driver = auth.require(req, Role.DRIVER);
        return emergencies.findByDriverIdOrderByCreatedAtDesc(driver.getId()).stream().map(this::toDto).toList();
    }

    @PostMapping("/requests/{id}/accept")
    public JobDto accept(HttpServletRequest req, @PathVariable Long id) {
        User driver = auth.require(req, Role.DRIVER);
        synchronized (takeLock) {
            if (activeJob(driver) != null) {
                throw new ApiException(409, "Finish your current request before taking another.");
            }
            EmergencyRequest e = find(id);
            if (e.getDriver() != null || e.getStatus() != Status.OPEN) {
                throw new ApiException(409, "Another ambulance has already taken this request.");
            }
            e.assignTo(driver);
            emergencies.save(e);
            notifications.add(e.getPatient(), "An ambulance (" + driver.getName() + ") has accepted your emergency request.");
            return toDto(e);
        }
    }

    /** Moves to the next stage only (Assigned → On route → Arrived → At hospital). */
    @PutMapping("/requests/{id}/stage")
    public JobDto stage(HttpServletRequest req, @PathVariable Long id, @RequestBody StageUpdate body) {
        EmergencyRequest e = ownJob(req, id);
        Stage next;
        try {
            next = Stage.valueOf(body.stage() == null ? "" : body.stage().trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new ApiException(400, "Unknown stage.");
        }
        if (e.getStatus() == Status.RESOLVED) {
            throw new ApiException(409, "This request is already completed.");
        }
        if (next.ordinal() != e.getStage().ordinal() + 1) {
            throw new ApiException(409, "Move through the stages in order.");
        }
        e.moveTo(next);
        emergencies.save(e);
        String text = switch (next) {
            case ON_ROUTE -> "The ambulance is on its way to you.";
            case ARRIVED -> "The ambulance has arrived at your location.";
            case AT_HOSPITAL -> "You have reached the hospital.";
            default -> null;
        };
        if (text != null) notifications.add(e.getPatient(), text);
        return toDto(e);
    }

    /** The ambulance's current GPS position. */
    @PutMapping("/requests/{id}/location")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void location(HttpServletRequest req, @PathVariable Long id, @RequestBody Position body) {
        EmergencyRequest e = ownJob(req, id);
        if (!EmergencyController.validPoint(body.latitude(), body.longitude())) {
            throw new ApiException(400, "That position is not valid.");
        }
        e.setDriverPosition(body.latitude(), body.longitude());
        emergencies.save(e);
    }

    @PutMapping("/requests/{id}/notes")
    public JobDto notes(HttpServletRequest req, @PathVariable Long id, @RequestBody Notes body) {
        EmergencyRequest e = ownJob(req, id);
        String text = body.notes() == null ? "" : body.notes().trim();
        e.setDriverNotes(text.length() > 500 ? text.substring(0, 500) : text);
        return toDto(emergencies.save(e));
    }

    // ---------------------------------------------------------------- helpers

    private EmergencyRequest find(Long id) {
        return emergencies.findById(id).orElseThrow(() -> new ApiException(404, "Request not found."));
    }

    /** The request, but only if it belongs to the logged-in driver. */
    private EmergencyRequest ownJob(HttpServletRequest req, Long id) {
        User driver = auth.require(req, Role.DRIVER);
        EmergencyRequest e = find(id);
        if (e.getDriver() == null || !e.getDriver().getId().equals(driver.getId())) {
            throw new ApiException(403, "This request is not assigned to you.");
        }
        return e;
    }

    private EmergencyRequest activeJob(User driver) {
        return emergencies.findByDriverIdOrderByCreatedAtDesc(driver.getId()).stream()
                .filter(e -> e.getStatus() != Status.RESOLVED).findFirst().orElse(null);
    }

    private JobDto toDto(EmergencyRequest e) {
        User p = e.getPatient();
        return new JobDto(e.getId(), p.getName(), age(p.getDateOfBirth()), p.getGender(), e.getPhone(),
                e.getLocation(), e.getLatitude(), e.getLongitude(), e.getDescription(), p.getMedicalConditions(),
                e.getSeverity().name(), e.getSeverity().targetMinutes(), e.getStatus().name(),
                e.getStage() == null ? null : e.getStage().name(),
                str(e.getCreatedAt()), str(e.getAssignedAt()), str(e.getOnRouteAt()),
                str(e.getArrivedAt()), str(e.getAtHospitalAt()), e.getDriverNotes(),
                e.getDriverLat(), e.getDriverLng());
    }

    private static String str(Object o) { return o == null ? null : o.toString(); }

    private static Integer age(String dob) {
        try {
            return dob == null || dob.isBlank() ? null : Period.between(LocalDate.parse(dob.trim()), LocalDate.now()).getYears();
        } catch (RuntimeException ex) {
            return null;
        }
    }
}