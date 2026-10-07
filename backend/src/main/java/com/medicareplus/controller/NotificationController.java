package com.medicareplus.controller;

import com.medicareplus.dto.Dtos.NotificationDto;
import com.medicareplus.security.AuthContext;
import com.medicareplus.service.NotificationService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notifications;
    private final AuthContext auth;

    public NotificationController(NotificationService notifications, AuthContext auth) {
        this.notifications = notifications;
        this.auth = auth;
    }

    @GetMapping
    public List<NotificationDto> list(HttpServletRequest req) {
        return notifications.list(auth.require(req));
    }

    @PostMapping("/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markRead(HttpServletRequest req) {
        notifications.markAllRead(auth.require(req));
    }
}
