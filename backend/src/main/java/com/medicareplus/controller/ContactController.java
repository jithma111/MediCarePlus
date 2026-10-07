package com.medicareplus.controller;

import com.medicareplus.dto.Dtos.ContactRequest;
import com.medicareplus.exception.ApiException;
import com.medicareplus.model.ContactMessage;
import com.medicareplus.repository.ContactMessageRepository;
import com.medicareplus.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/contact")
public class ContactController {

    private final ContactMessageRepository messages;

    public ContactController(ContactMessageRepository messages) {
        this.messages = messages;
    }

    /** Public: the "Contact us" form. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> send(@RequestBody ContactRequest body) {
        String name = body.name() == null ? "" : body.name().trim();
        String email = body.email() == null ? "" : body.email().trim();
        String text = body.message() == null ? "" : body.message().trim();
        if (name.isEmpty() || !AuthService.EMAIL.matcher(email).matches() || text.isEmpty()) {
            throw new ApiException(400, "Fill in your name, a valid email and a message.");
        }
        messages.save(new ContactMessage(cut(name, 120), cut(email, 120), cut(text, 2000)));
        return Map.of("message", "Message received.");
    }

    private static String cut(String s, int max) {
        return s.length() > max ? s.substring(0, max) : s;
    }
}
