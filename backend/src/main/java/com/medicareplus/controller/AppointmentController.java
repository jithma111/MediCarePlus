package com.medicareplus.controller;

import com.medicareplus.dto.Dtos.AppointmentDto;
import com.medicareplus.dto.Dtos.AppointmentRequest;
import com.medicareplus.dto.Dtos.RescheduleRequest;
import com.medicareplus.dto.Dtos.StatusRequest;
import com.medicareplus.security.AuthContext;
import com.medicareplus.service.AppointmentService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private final AppointmentService appointments;
    private final AuthContext auth;

    public AppointmentController(AppointmentService appointments, AuthContext auth) {
        this.appointments = appointments;
        this.auth = auth;
    }

    @GetMapping
    public List<AppointmentDto> list(HttpServletRequest req) {
        return appointments.listFor(auth.require(req));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AppointmentDto book(@RequestBody AppointmentRequest body, HttpServletRequest req) {
        return appointments.book(auth.require(req), body);
    }

    @PutMapping("/{id}/reschedule")
    public AppointmentDto reschedule(@PathVariable Long id, @RequestBody RescheduleRequest body, HttpServletRequest req) {
        return appointments.reschedule(auth.require(req), id, body);
    }

    @PatchMapping("/{id}/status")
    public AppointmentDto status(@PathVariable Long id, @RequestBody StatusRequest body, HttpServletRequest req) {
        return appointments.updateStatus(auth.require(req), id, body);
    }
}
