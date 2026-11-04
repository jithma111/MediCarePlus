package com.medicareplus.controller;

import com.medicareplus.dto.Dtos.ContactRequest;
import com.medicareplus.exception.ApiException;
import com.medicareplus.model.ContactMessage;
import com.medicareplus.model.Role;
import com.medicareplus.model.User;
import com.medicareplus.repository.ContactMessageRepository;
import com.medicareplus.security.AuthContext;
import com.medicareplus.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class ContactController {

    public record MessageDto(Long id, String name, String email, String message,
                             boolean seen, String createdAt, String updatedAt) { }
    public record EditRequest(String message) { }

    private final ContactMessageRepository messages;
    private final AuthContext auth;

    public ContactController(ContactMessageRepository messages, AuthContext auth) {
        this.messages = messages;
        this.auth = auth;
    }

    /** CREATE: the "Contact us" form. Linked to the sender when they are logged in. */
    @PostMapping("/api/contact")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> send(HttpServletRequest req, @RequestBody ContactRequest body) {
        String name = clean(body.name());
        String email = clean(body.email());
        String text = clean(body.message());
        if (name.isEmpty() || !AuthService.EMAIL.matcher(email).matches() || text.isEmpty()) {
            throw new ApiException(400, "Fill in your name, a valid email and a message.");
        }
        User sender = loggedIn(req);
        messages.save(new ContactMessage(cut(name, 120), cut(email, 120), cut(text, 2000),
                sender == null ? null : sender.getId()));
        return Map.of("message", "Message received.");
    }

    /** READ: a patient sees their own messages. */
    @GetMapping("/api/contact/mine")
    public List<MessageDto> mine(HttpServletRequest req) {
        User u = auth.require(req, Role.PATIENT);
        return messages.findBySenderIdOrderByCreatedAtDesc(u.getId()).stream().map(this::toDto).toList();
    }

    /** UPDATE: a patient edits their own message. */
    @PutMapping("/api/contact/{id}")
    public MessageDto edit(HttpServletRequest req, @PathVariable Long id, @RequestBody EditRequest body) {
        User u = auth.require(req, Role.PATIENT);
        ContactMessage m = own(u, id);
        String text = clean(body.message());
        if (text.isEmpty()) {
            throw new ApiException(400, "The message cannot be empty.");
        }
        m.setMessage(cut(text, 2000));
        return toDto(messages.save(m));
    }

    /** DELETE: a patient deletes their own message. */
    @DeleteMapping("/api/contact/{id}")
    public Map<String, String> deleteOwn(HttpServletRequest req, @PathVariable Long id) {
        User u = auth.require(req, Role.PATIENT);
        messages.delete(own(u, id));
        return Map.of("message", "Deleted.");
    }

    /** READ: the admin inbox, newest first. */
    @GetMapping("/api/admin/messages")
    public List<MessageDto> inbox(HttpServletRequest req) {
        auth.require(req, Role.ADMIN);
        return messages.findAllByOrderByCreatedAtDesc().stream().map(this::toDto).toList();
    }

    @PutMapping("/api/admin/messages/{id}/read")
    public MessageDto markRead(HttpServletRequest req, @PathVariable Long id) {
        auth.require(req, Role.ADMIN);
        ContactMessage m = messages.findById(id).orElseThrow(() -> new ApiException(404, "Message not found."));
        m.markSeen();
        return toDto(messages.save(m));
    }

    @DeleteMapping("/api/admin/messages/{id}")
    public Map<String, String> deleteAny(HttpServletRequest req, @PathVariable Long id) {
        auth.require(req, Role.ADMIN);
        if (!messages.existsById(id)) {
            throw new ApiException(404, "Message not found.");
        }
        messages.deleteById(id);
        return Map.of("message", "Deleted.");
    }

    /** The message must belong to this patient. */
    private ContactMessage own(User u, Long id) {
        return messages.findById(id)
                .filter(m -> u.getId().equals(m.getSenderId()))
                .orElseThrow(() -> new ApiException(404, "Message not found."));
    }

    /** The logged-in user, or null for a visitor. */
    private User loggedIn(HttpServletRequest req) {
        try {
            return auth.require(req);
        } catch (ApiException e) {
            return null;
        }
    }

    private MessageDto toDto(ContactMessage m) {
        return new MessageDto(m.getId(), m.getName(), m.getEmail(), m.getMessage(), m.isSeen(),
                m.getCreatedAt().toString(), m.getUpdatedAt() == null ? null : m.getUpdatedAt().toString());
    }

    private static String clean(String s) { return s == null ? "" : s.trim(); }
    private static String cut(String s, int max) { return s.length() > max ? s.substring(0, max) : s; }
}