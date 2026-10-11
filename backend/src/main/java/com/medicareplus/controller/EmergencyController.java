package com.medicareplus.controller;

import com.medicareplus.exception.ApiException;
import com.medicareplus.model.EmergencyRequest;
import com.medicareplus.model.EmergencyRequest.Severity;
import com.medicareplus.model.EmergencyRequest.Status;
import com.medicareplus.model.Role;
import com.medicareplus.model.User;
import com.medicareplus.repository.EmergencyRepository;
import com.medicareplus.security.AuthContext;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/emergencies")
public class EmergencyController {

    public record NewEmergency(String phone, String location, String description, String severity) { }
    public record StatusUpdate(String status) { }
    public record EmergencyDto(Long id, String patient, String phone, String location, String description,
                               String severity, int targetMinutes, String status, String createdAt) { }

    private final EmergencyRepository emergencies;
    private final AuthContext auth;

    public EmergencyController(EmergencyRepository emergencies, AuthContext auth) {
        this.emergencies = emergencies;
        this.auth = auth;
    }

    /** CREATE: a patient reports an emergency. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EmergencyDto create(HttpServletRequest req, @RequestBody NewEmergency body) {
        User patient = auth.require(req, Role.PATIENT);
        String phone = clean(body.phone());
        String location = clean(body.location());
        String description = clean(body.description());
        if (phone.isEmpty() || location.isEmpty() || description.isEmpty()) {
            throw new ApiException(400, "Fill in your phone, location and what happened.");
        }
        Severity severity;
        try {
            severity = Severity.valueOf(clean(body.severity()).toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ApiException(400, "Choose a severity.");
        }
        return toDto(emergencies.save(new EmergencyRequest(patient, cut(phone, 30), cut(location, 255),
                cut(description, 1000), severity)));
    }

    /** READ: a patient sees only their own requests. */
    @GetMapping("/mine")
    public List<EmergencyDto> mine(HttpServletRequest req) {
        User patient = auth.require(req, Role.PATIENT);
        return emergencies.findByPatientIdOrderByCreatedAtDesc(patient.getId()).stream().map(this::toDto).toList();
    }

    /** READ: staff see every request, most severe first, resolved last. */
    @GetMapping
    public List<EmergencyDto> all(HttpServletRequest req) {
        auth.require(req, Role.ADMIN, Role.DOCTOR);
        List<EmergencyRequest> list = new ArrayList<>(emergencies.findAll());
        list.sort(Comparator.comparing((EmergencyRequest e) -> e.getStatus() == Status.RESOLVED)
                .thenComparing((EmergencyRequest e) -> e.getSeverity().ordinal(), Comparator.reverseOrder())
                .thenComparing(EmergencyRequest::getCreatedAt));
        return list.stream().map(this::toDto).toList();
    }

    /** UPDATE: staff change the status. */
    @PutMapping("/{id}/status")
    public EmergencyDto updateStatus(HttpServletRequest req, @PathVariable Long id, @RequestBody StatusUpdate body) {
        auth.require(req, Role.ADMIN, Role.DOCTOR);
        EmergencyRequest e = emergencies.findById(id).orElseThrow(() -> new ApiException(404, "Request not found."));
        try {
            e.setStatus(Status.valueOf(clean(body.status()).toUpperCase()));
        } catch (IllegalArgumentException ex) {
            throw new ApiException(400, "Unknown status.");
        }
        return toDto(emergencies.save(e));
    }

    /** DELETE: only the admin removes a request. */
    @DeleteMapping("/{id}")
    public Map<String, String> delete(HttpServletRequest req, @PathVariable Long id) {
        auth.require(req, Role.ADMIN);
        if (!emergencies.existsById(id)) {
            throw new ApiException(404, "Request not found.");
        }
        emergencies.deleteById(id);
        return Map.of("message", "Deleted.");
    }

    private EmergencyDto toDto(EmergencyRequest e) {
        return new EmergencyDto(e.getId(), e.getPatient().getName(), e.getPhone(), e.getLocation(),
                e.getDescription(), e.getSeverity().name(), e.getSeverity().targetMinutes(),
                e.getStatus().name(), e.getCreatedAt().toString());
    }

    private static String clean(String s) { return s == null ? "" : s.trim(); }
    private static String cut(String s, int max) { return s.length() > max ? s.substring(0, max) : s; }
}
