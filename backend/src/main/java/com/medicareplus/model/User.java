package com.medicareplus.model;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 120)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(name = "medical_conditions", length = 1000)
    private String medicalConditions;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "VARCHAR(20)")
    private Role role;

    /** Only set for DOCTOR accounts: links the login to the doctor profile. */
    @ManyToOne
    @JoinColumn(name = "doctor_id")
    private Doctor doctor;

    public User() {
    }

    public User(String email, String passwordHash, String name, Role role, Doctor doctor) {
        this.email = email;
        this.passwordHash = passwordHash;
        this.name = name;
        this.role = role;
        this.doctor = doctor;
    }

    public Long getId() { return id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public String getName() { return name; }
    public void setName(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Name is required.");
        }
        this.name = name.trim();
    }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    public Doctor getDoctor() { return doctor; }
    public void setDoctor(Doctor doctor) { this.doctor = doctor; }

    //
    @Column(length = 30) private String phone;
    @Column(name = "date_of_birth", length = 10) private String dateOfBirth;
    @Column(length = 10) private String gender;
    @Column(length = 255) private String address;
    @Column(columnDefinition = "LONGTEXT") private String photo; // small image stored as text

    public String getPhone() { return phone; }
    public void setPhone(String v) { this.phone = v; }
    public String getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(String v) { this.dateOfBirth = v; }
    public String getGender() { return gender; }
    public void setGender(String v) { this.gender = v; }
    public String getAddress() { return address; }
    public void setAddress(String v) { this.address = v; }
    public String getPhoto() { return photo; }
    public void setPhoto(String v) { this.photo = v; }
    public String getMedicalConditions() { return medicalConditions; }
    public void setMedicalConditions(String v) { this.medicalConditions = v; }

    /** Two users are the same if they have the same id. */
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof User other)) return false;
        return id != null && id.equals(other.id);
    }

    @Override
    public int hashCode() { return getClass().hashCode(); }

    /** The password hash is never printed (information hiding). */
    @Override
    public String toString() {
        return "User{id=" + id + ", email=" + email + ", role=" + role + "}";
    }
}
