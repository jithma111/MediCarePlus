package com.medicareplus.controller;

import com.medicareplus.dto.Dtos.StatsDto;
import com.medicareplus.model.Role;
import com.medicareplus.repository.AdminRepository;
import com.medicareplus.security.AuthContext;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminRepository admins;
    private final AuthContext auth;

    public AdminController(AdminRepository admins, AuthContext auth) {
        this.admins = admins;
        this.auth = auth;
    }

    @GetMapping("/stats")
    public StatsDto stats(HttpServletRequest req) {
        auth.require(req, Role.ADMIN);
        return new StatsDto(admins.countByRole(Role.PATIENT));
    }
}