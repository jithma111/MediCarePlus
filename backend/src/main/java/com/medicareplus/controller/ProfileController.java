package com.medicareplus.controller;

import com.medicareplus.exception.ApiException;
import com.medicareplus.model.User;
import com.medicareplus.repository.UserRepository;
import com.medicareplus.security.AuthContext;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {
    private final AuthContext auth;
    private final UserRepository users;

    public ProfileController(AuthContext auth, UserRepository users) {
        this.auth = auth;
        this.users = users;
    }

    public record ProfileDto(String name, String email, String phone, String dateOfBirth,
                             String gender, String address, String photo) { }

    @GetMapping
    public ProfileDto get(HttpServletRequest req) {
        return toDto(auth.require(req));
    }

    @PutMapping
    public ProfileDto update(HttpServletRequest req, @RequestBody ProfileDto b) {
        User u = auth.require(req);
        if (b.name() == null || b.name().isBlank()) throw new ApiException(400, "Name is required.");
        String photo = b.photo() == null ? "" : b.photo();
        if (!photo.isEmpty() && (!photo.startsWith("data:image/") || photo.length() > 400_000))
            throw new ApiException(400, "Photo must be a small image.");
        u.setName(b.name().trim());
        u.setPhone(b.phone());
        u.setDateOfBirth(b.dateOfBirth());
        u.setGender(b.gender());
        u.setAddress(b.address());
        u.setPhoto(photo);
        users.save(u);
        return toDto(u);
    }

    private ProfileDto toDto(User u) {
        return new ProfileDto(u.getName(), u.getEmail(), u.getPhone(), u.getDateOfBirth(),
                u.getGender(), u.getAddress(), u.getPhoto());
    }
}

