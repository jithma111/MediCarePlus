package com.medicareplus.model;

import jakarta.persistence.*;

import java.util.Set;
import java.util.TreeSet;

@Entity
@Table(name = "doctors")
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, length = 100)
    private String specialty;

    @Column(nullable = false, length = 150)
    private String hospital;

    @Column(name = "years_experience", nullable = false)
    private int yearsExperience;

    @Column(length = 255)
    private String qualifications;

    @Column(length = 1000)
    private String bio;

    /** Days of week the doctor works: 0 = Sunday ... 6 = Saturday. */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "doctor_available_days", joinColumns = @JoinColumn(name = "doctor_id"))
    @Column(name = "day_of_week", nullable = false)
    private Set<Integer> availableDays = new TreeSet<>();

    /** false = removed by the admin (kept so old appointments still show the doctor's name). */
    @Column(nullable = false)
    private boolean active = true;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getSpecialty() { return specialty; }
    public void setSpecialty(String specialty) { this.specialty = specialty; }
    public String getHospital() { return hospital; }
    public void setHospital(String hospital) { this.hospital = hospital; }
    public int getYearsExperience() { return yearsExperience; }
    public void setYearsExperience(int yearsExperience) { this.yearsExperience = yearsExperience; }
    public String getQualifications() { return qualifications; }
    public void setQualifications(String qualifications) { this.qualifications = qualifications; }
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
    public Set<Integer> getAvailableDays() { return availableDays; }
    public void setAvailableDays(Set<Integer> availableDays) { this.availableDays = availableDays; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
