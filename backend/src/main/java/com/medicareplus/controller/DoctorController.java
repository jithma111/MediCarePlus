package com.medicareplus.controller;

import com.medicareplus.dto.Dtos.BookedSlotDto;
import com.medicareplus.dto.Dtos.DoctorDto;
import com.medicareplus.dto.Dtos.DoctorRequest;
import com.medicareplus.model.Role;
import com.medicareplus.security.AuthContext;
import com.medicareplus.service.DoctorService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/doctors")
public class DoctorController {

    private final DoctorService doctors;
    private final AuthContext auth;

    public DoctorController(DoctorService doctors, AuthContext auth) {
        this.doctors = doctors;
        this.auth = auth;
    }

    /** Public: anyone can browse doctors. */
    @GetMapping
    public List<DoctorDto> list() {
        return doctors.list();
    }

    @GetMapping("/{id}")
    public DoctorDto get(@PathVariable Long id) {
        return doctors.get(id);
    }

    /** Public: which slots are already taken (no personal data). */
    @GetMapping("/{id}/booked")
    public List<BookedSlotDto> booked(@PathVariable Long id) {
        return doctors.booked(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DoctorDto create(@RequestBody DoctorRequest body, HttpServletRequest req) {
        auth.require(req, Role.ADMIN);
        return doctors.create(body);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@PathVariable Long id, HttpServletRequest req) {
        auth.require(req, Role.ADMIN);
        doctors.remove(id);
    }
}
