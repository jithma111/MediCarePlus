package com.medicareplus.controller;

import com.medicareplus.dto.Dtos.*;
import com.medicareplus.security.AuthContext;
import com.medicareplus.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final AuthContext auth;

    public AuthController(AuthService authService, AuthContext auth) {
        this.authService = authService;
        this.auth = auth;
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest body) {
        return authService.login(body);
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@RequestBody RegisterRequest body) {
        return authService.register(body);
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(HttpServletRequest req) {
        auth.revoke(req);
    }

    @GetMapping("/me")
    public UserDto me(HttpServletRequest req) {
        return UserDto.of(auth.require(req));
    }
}
