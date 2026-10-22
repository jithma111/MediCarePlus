package com.medicareplus.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "contact_messages")
public class ContactMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, length = 120)
    private String email;

    @Column(nullable = false, length = 2000)
    private String message;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    /** Id of the logged-in patient who sent it (a plain number, so deleting a user never blocks). */
    @Column(name = "sender_id")
    private Long senderId;

    @Column(name = "is_read", columnDefinition = "boolean default false")
    private boolean seen = false;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public ContactMessage() { }

    public ContactMessage(String name, String email, String message, Long senderId) {
        this.name = name;
        this.email = email;
        this.message = message;
        this.senderId = senderId;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getMessage() { return message; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public Long getSenderId() { return senderId; }
    public boolean isSeen() { return seen; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    /** Editing a message marks it unread again, so the admin notices the change. */
    public void setMessage(String message) {
        this.message = message;
        this.updatedAt = LocalDateTime.now();
        this.seen = false;
    }

    public void markSeen() { this.seen = true; }
}