package com.medicareplus.service;

import com.medicareplus.dto.Dtos.AppointmentDto;
import com.medicareplus.dto.Dtos.AppointmentRequest;
import com.medicareplus.dto.Dtos.RescheduleRequest;
import com.medicareplus.dto.Dtos.StatusRequest;
import com.medicareplus.exception.ApiException;
import com.medicareplus.model.*;
import com.medicareplus.repository.AppointmentRepository;
import com.medicareplus.repository.DoctorRepository;
import com.medicareplus.util.Dates;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
public class AppointmentService {

    /** Bookable time slots (same list the front end shows). */
    public static final List<String> TIMES = List.of("09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
            "14:00", "14:30", "15:00", "15:30", "16:00", "16:30");

    private final AppointmentRepository appointments;
    private final DoctorRepository doctors;
    private final NotificationService notifications;

    public AppointmentService(AppointmentRepository appointments, DoctorRepository doctors,
                              NotificationService notifications) {
        this.appointments = appointments;
        this.doctors = doctors;
        this.notifications = notifications;
    }

    /** Patients see their own, doctors see their own, admins see everything. */
    @Transactional(readOnly = true)
    public List<AppointmentDto> listFor(User user) {
        List<Appointment> list;
        switch (user.getRole()) {
            case ADMIN -> list = appointments.findAllByOrderByApptDateDescApptTimeDesc();
            case DOCTOR -> list = user.getDoctor() == null ? List.of()
                    : appointments.findByDoctorIdOrderByApptDateAscApptTimeAsc(user.getDoctor().getId());
            default -> list = appointments.findByPatientIdOrderByApptDateAscApptTimeAsc(user.getId());
        }
        return list.stream().map(AppointmentDto::of).toList();
    }

    @Transactional
    public AppointmentDto book(User patient, AppointmentRequest r) {
        if (patient.getRole() != Role.PATIENT) {
            throw new ApiException(403, "Log in as a patient to book.");
        }
        Doctor doctor = r.doctorId() == null ? null : doctors.findByIdAndActiveTrue(r.doctorId()).orElse(null);
        if (doctor == null) {
            throw new ApiException(404, "Doctor not found.");
        }
        LocalDate date = parseDate(r.date());
        LocalTime time = parseTime(r.time());
        validateSlot(doctor, date, time, -1L);

        Appointment a = new Appointment();
        a.setDoctor(doctor);
        a.setPatient(patient);
        a.setApptDate(date);
        a.setApptTime(time);
        a.setReason(r.reason() == null || r.reason().isBlank() ? "New concern" : trim(r.reason(), 120));
        a.setStatus(AppointmentStatus.PENDING);
        a = appointments.save(a);

        notifications.add(patient, "Request sent to " + doctor.getName() + " for " + Dates.display(date) + " at " + time + ".");
        notifications.addForDoctor(doctor, "New request from " + patient.getName() + ": " + Dates.display(date) + " at " + time + ".");
        return AppointmentDto.of(a);
    }

    @Transactional
    public AppointmentDto reschedule(User user, Long id, RescheduleRequest r) {
        Appointment a = find(id);
        if (user.getRole() != Role.PATIENT || !a.getPatient().getId().equals(user.getId())) {
            throw new ApiException(403, "You can only reschedule your own appointments.");
        }
        if (!a.getStatus().isActive()) {
            throw new ApiException(400, "Only pending or confirmed appointments can be rescheduled.");
        }
        LocalDate date = parseDate(r.date());
        LocalTime time = parseTime(r.time());
        validateSlot(a.getDoctor(), date, time, a.getId());

        a.setApptDate(date);
        a.setApptTime(time);
        a.setStatus(AppointmentStatus.PENDING);
        a.setPatientReminderSent(false);
        a.setDoctorReminderSent(false);

        notifications.add(a.getPatient(), "Rescheduled to " + Dates.display(date) + " at " + time + " with " + a.getDoctor().getName() + ".");
        notifications.addForDoctor(a.getDoctor(), a.getPatient().getName() + " rescheduled to " + Dates.display(date) + " at " + time + ".");
        return AppointmentDto.of(a);
    }

    @Transactional
    public AppointmentDto updateStatus(User user, Long id, StatusRequest r) {
        Appointment a = find(id);
        AppointmentStatus next = AppointmentStatus.fromLabel(r.status());

        switch (user.getRole()) {
            case PATIENT -> {
                if (!a.getPatient().getId().equals(user.getId()) || next != AppointmentStatus.CANCELLED) {
                    throw new ApiException(403, "You can only cancel your own appointments.");
                }
            }
            case DOCTOR -> {
                if (user.getDoctor() == null || !a.getDoctor().getId().equals(user.getDoctor().getId())
                        || next == AppointmentStatus.PENDING) {
                    throw new ApiException(403, "You do not have permission to do that.");
                }
            }
            case ADMIN -> {
                if (next != AppointmentStatus.CANCELLED) {
                    throw new ApiException(403, "Admins can only cancel appointments.");
                }
            }
        }

        AppointmentStatus current = a.getStatus();
        boolean allowed = switch (next) {
            case CONFIRMED -> current == AppointmentStatus.PENDING;
            case COMPLETED -> current == AppointmentStatus.CONFIRMED;
            case CANCELLED -> current.isActive();
            case PENDING -> false;
        };
        if (!allowed) {
            throw new ApiException(400, "That change is not possible for a " + current.label().toLowerCase() + " appointment.");
        }

        a.setStatus(next);
        String when = Dates.display(a.getApptDate());
        notifications.add(a.getPatient(), a.getDoctor().getName() + ": your appointment on " + when + " is now " + next.label() + ".");
        if (user.getRole() == Role.PATIENT) {
            notifications.addForDoctor(a.getDoctor(), a.getPatient().getName() + " " + next.label().toLowerCase()
                    + " the appointment on " + when + ".");
        }
        return AppointmentDto.of(a);
    }

    // ---------- helpers ----------

    private Appointment find(Long id) {
        return appointments.findById(id).orElseThrow(() -> new ApiException(404, "Appointment not found."));
    }

    private void validateSlot(Doctor doctor, LocalDate date, LocalTime time, Long excludeId) {
        LocalDate today = LocalDate.now();
        if (!date.isAfter(today) || date.isAfter(today.plusDays(60))) {
            throw new ApiException(400, "Choose a date within the next 60 days.");
        }
        // Java: Monday=1..Sunday=7  ->  0=Sunday..6=Saturday (same as JavaScript getDay())
        if (!doctor.getAvailableDays().contains(date.getDayOfWeek().getValue() % 7)) {
            throw new ApiException(400, "The doctor is not available on that day.");
        }
        if (appointments.countInSlot(doctor.getId(), date, time, AppointmentStatus.CANCELLED, excludeId) > 0) {
            throw new ApiException(409, "That time slot was just taken. Please choose another.");
        }
    }

    private static LocalDate parseDate(String s) {
        try {
            return LocalDate.parse(s);
        } catch (Exception e) {
            throw new ApiException(400, "Choose a valid date.");
        }
    }

    private static LocalTime parseTime(String s) {
        if (s == null || !TIMES.contains(s)) {
            throw new ApiException(400, "Choose a valid time slot.");
        }
        return LocalTime.parse(s);
    }

    private static String trim(String s, int max) {
        String t = s.trim();
        return t.length() > max ? t.substring(0, max) : t;
    }
}
