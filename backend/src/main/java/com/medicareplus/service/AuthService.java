package com.medicareplus.service;

import com.medicareplus.dto.Dtos.AuthResponse;
import com.medicareplus.dto.Dtos.LoginRequest;
import com.medicareplus.dto.Dtos.RegisterRequest;
import com.medicareplus.dto.Dtos.UserDto;
import com.medicareplus.exception.ApiException;
import com.medicareplus.model.Role;
import com.medicareplus.model.User;
import com.medicareplus.repository.UserRepository;
import com.medicareplus.security.AuthContext;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.regex.Pattern;

@Service
public class AuthService {

    public static final Pattern EMAIL = Pattern.compile("^\\S+@\\S+\\.\\S+$");

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final AuthContext auth;

    public AuthService(UserRepository users, PasswordEncoder encoder, AuthContext auth) {
        this.users = users;
        this.encoder = encoder;
        this.auth = auth;
    }

    public AuthResponse login(LoginRequest r) {
        String email = r.email() == null ? "" : r.email().trim().toLowerCase();
        String password = r.password() == null ? "" : r.password();
        User user = users.findByEmailIgnoreCase(email)
                .filter(u -> encoder.matches(password, u.getPasswordHash()))
                .orElseThrow(() -> new ApiException(401, "Email or password is incorrect."));
        return new AuthResponse(auth.issueToken(user), UserDto.of(user));
    }

    /** Public registration always creates a PATIENT account. */
    public AuthResponse register(RegisterRequest r) {
        String name = r.name() == null ? "" : r.name().trim();
        String email = r.email() == null ? "" : r.email().trim().toLowerCase();
        String password = r.password() == null ? "" : r.password();

        if (name.isEmpty() || !EMAIL.matcher(email).matches()) {
            throw new ApiException(400, "Enter your name and a valid email.");
        }
        if (password.length() < 6) {
            throw new ApiException(400, "Password must be at least 6 characters.");
        }
        if (users.existsByEmailIgnoreCase(email)) {
            throw new ApiException(409, "That email is already registered. Log in instead.");
        }
        User user = users.save(new User(email, encoder.encode(password), name, Role.PATIENT, null));
        return new AuthResponse(auth.issueToken(user), UserDto.of(user));
    }
}
