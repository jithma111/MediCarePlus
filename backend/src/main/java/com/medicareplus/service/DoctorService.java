package com.medicareplus.service;

import com.medicareplus.dto.Dtos.BookedSlotDto;
import com.medicareplus.dto.Dtos.DoctorDto;
import com.medicareplus.dto.Dtos.DoctorRequest;
import com.medicareplus.exception.ApiException;
import com.medicareplus.model.*;
import com.medicareplus.repository.AppointmentRepository;
import com.medicareplus.repository.DoctorRepository;
import com.medicareplus.repository.NotificationRepository;
import com.medicareplus.repository.UserRepository;
import com.medicareplus.util.Dates;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.TreeSet;

@Service
public class DoctorService {

    private final DoctorRepository doctors;
    private final UserRepository users;
    private final AppointmentRepository appointments;
    private final NotificationRepository notificationRepo;
    private final NotificationService notifications;
    private final PasswordEncoder encoder;

    public DoctorService(DoctorRepository doctors, UserRepository users, AppointmentRepository appointments,
                         NotificationRepository notificationRepo, NotificationService notifications,
                         PasswordEncoder encoder) {
        this.doctors = doctors;
        this.users = users;
        this.appointments = appointments;
        this.notificationRepo = notificationRepo;
        this.notifications = notifications;
        this.encoder = encoder;
    }

    @Transactional(readOnly = true)
    public List<DoctorDto> list() {
        return doctors.findByActiveTrueOrderByIdAsc().stream().map(DoctorDto::of).toList();
    }

    @Transactional(readOnly = true)
    public DoctorDto get(Long id) {
        return DoctorDto.of(doctors.findByIdAndActiveTrue(id).orElseThrow(() -> new ApiException(404, "Doctor not found.")));
    }

    /** Slots already taken (not cancelled) from today on. */
    @Transactional(readOnly = true)
    public List<BookedSlotDto> booked(Long doctorId) {
        LocalDate today = LocalDate.now();
        return appointments.findByDoctorIdAndStatusNot(doctorId, AppointmentStatus.CANCELLED).stream()
                .filter(a -> !a.getApptDate().isBefore(today))
                .map(a -> new BookedSlotDto(a.getId(), a.getApptDate().toString(), a.getApptTime().toString()))
                .toList();
    }

    /** Creates the doctor profile and the doctor's login. */
    @Transactional
    public DoctorDto create(DoctorRequest r) {
        String name = clean(r.name());
        String specialty = clean(r.specialty());
        String hospital = clean(r.hospital());
        String email = clean(r.email()).toLowerCase();
        String password = r.password() == null ? "" : r.password();

        if (name.isEmpty() || specialty.isEmpty() || hospital.isEmpty()) {
            throw new ApiException(400, "Enter the doctor's name, specialty and hospital.");
        }
        if (r.availableDays() == null || r.availableDays().isEmpty()
                || r.availableDays().stream().anyMatch(d -> d == null || d < 0 || d > 6)) {
            throw new ApiException(400, "Select at least one available day.");
        }
        if (!AuthService.EMAIL.matcher(email).matches()) {
            throw new ApiException(400, "Enter a valid login email.");
        }
        if (password.length() < 6) {
            throw new ApiException(400, "Password must be at least 6 characters.");
        }
        if (users.existsByEmailIgnoreCase(email)) {
            throw new ApiException(409, "That email is already in use.");
        }

        Doctor d = new Doctor();
        d.setName(name.startsWith("Dr.") ? name : "Dr. " + name);
        d.setSpecialty(specialty);
        d.setHospital(hospital);
        d.setYearsExperience(r.yearsExperience() == null ? 0 : Math.max(0, r.yearsExperience()));
        d.setQualifications(clean(r.qualifications()).isEmpty() ? "Qualifications not listed" : clean(r.qualifications()));
        d.setBio(clean(r.bio()).isEmpty() ? "Doctor at MediCare Plus." : clean(r.bio()));
        d.setAvailableDays(new TreeSet<>(r.availableDays()));
        d = doctors.save(d);

        users.save(new User(email, encoder.encode(password), d.getName(), Role.DOCTOR, d));
        return DoctorDto.of(d);
    }

    /** Removes a doctor: open appointments are cancelled and patients are notified. */
    @Transactional
    public void remove(Long id) {
        Doctor d = doctors.findByIdAndActiveTrue(id).orElseThrow(() -> new ApiException(404, "Doctor not found."));

        for (Appointment a : appointments.findByDoctorIdAndStatusIn(id, List.of(AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED))) {
            a.setStatus(AppointmentStatus.CANCELLED);
            notifications.add(a.getPatient(), "Your appointment with " + d.getName() + " on "
                    + Dates.display(a.getApptDate()) + " was cancelled because the doctor is no longer available.");
        }
        for (User login : users.findByDoctorId(id)) {
            notificationRepo.deleteByUserId(login.getId());
            users.delete(login);
        }
        d.setActive(false);
    }

    private static String clean(String s) {
        return s == null ? "" : s.trim();
    }
}
