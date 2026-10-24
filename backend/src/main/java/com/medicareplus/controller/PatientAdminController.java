package com.medicareplus.controller;

import com.medicareplus.exception.ApiException;
import com.medicareplus.model.Role;
import com.medicareplus.model.User;
import com.medicareplus.repository.UserRepository;
import com.medicareplus.security.AuthContext;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/admin/patients")
public class PatientAdminController {

    private static final Pattern EMAIL = Pattern.compile("^\\S+@\\S+\\.\\S+$");

    public record PatientDto(Long id, String name, String email, String phone, String dateOfBirth,
                             String gender, String address, String medicalConditions) { }
    public record NewPatient(String name, String email, String password, String phone, String dateOfBirth,
                             String gender, String address, String medicalConditions) { }

    private final UserRepository users;
    private final AuthContext auth;
    private final PasswordEncoder encoder;

    public PatientAdminController(UserRepository users, AuthContext auth, PasswordEncoder encoder) {
        this.users = users;
        this.auth = auth;
        this.encoder = encoder;
    }

    /** READ: every patient with their details (admin only). */
    @GetMapping
    public List<PatientDto> list(HttpServletRequest req) {
        auth.require(req, Role.ADMIN);
        return users.findAll().stream()
                .filter(u -> u.getRole() == Role.PATIENT)
                .sorted(Comparator.comparing(u -> u.getName().toLowerCase()))
                .map(this::toDto)
                .toList();
    }

    /** CREATE: the admin adds a patient account (admin only). */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PatientDto create(HttpServletRequest req, @RequestBody NewPatient b) {
        auth.require(req, Role.ADMIN);
        String name = clean(b.name());
        String email = clean(b.email()).toLowerCase();
        String password = b.password() == null ? "" : b.password();
        if (name.isEmpty()) throw new ApiException(400, "Enter the patient's name.");
        if (!EMAIL.matcher(email).matches()) throw new ApiException(400, "Enter a valid email.");
        if (password.length() < 6) throw new ApiException(400, "Password must be at least 6 characters.");
        if (users.findAll().stream().anyMatch(u -> u.getEmail().equalsIgnoreCase(email))) {
            throw new ApiException(409, "That email is already in use.");
        }
        User u = new User(email, encoder.encode(password), name, Role.PATIENT, null);
        u.setPhone(clean(b.phone()));
        u.setDateOfBirth(clean(b.dateOfBirth()));
        u.setGender(clean(b.gender()));
        u.setAddress(clean(b.address()));
        u.setMedicalConditions(clean(b.medicalConditions()));
        return toDto(users.save(u));
    }

    private PatientDto toDto(User u) {
        return new PatientDto(u.getId(), u.getName(), u.getEmail(), u.getPhone(), u.getDateOfBirth(),
                u.getGender(), u.getAddress(), u.getMedicalConditions());
    }

    private static String clean(String s) { return s == null ? "" : s.trim(); }
}