package com.medicareplus.service;

import com.medicareplus.dto.Dtos.NotificationDto;
import com.medicareplus.model.*;
import com.medicareplus.repository.AppointmentRepository;
import com.medicareplus.repository.NotificationRepository;
import com.medicareplus.repository.UserRepository;
import com.medicareplus.util.Dates;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notifications;
    private final UserRepository users;
    private final AppointmentRepository appointments;

    public NotificationService(NotificationRepository notifications, UserRepository users,
                               AppointmentRepository appointments) {
        this.notifications = notifications;
        this.users = users;
        this.appointments = appointments;
    }

    @Transactional
    public void add(User user, String text) {
        notifications.save(new Notification(user, text));
    }

    /** Notify every login that belongs to the doctor profile. */
    @Transactional
    public void addForDoctor(Doctor doctor, String text) {
        for (User u : users.findByDoctorId(doctor.getId())) {
            add(u, text);
        }
    }

    /** Latest notifications for the user (reminders for visits in the next 48 hours are created on the way). */
    @Transactional
    public List<NotificationDto> list(User user) {
        createReminders(user);
        return notifications.findTop12ByUserIdOrderByCreatedAtDescIdDesc(user.getId())
                .stream().map(NotificationDto::of).toList();
    }

    @Transactional
    public void markAllRead(User user) {
        notifications.markAllSeen(user.getId());
    }

    private void createReminders(User user) {
        List<Appointment> due;
        if (user.getRole() == Role.PATIENT) {
            due = appointments.findByPatientIdAndStatusAndPatientReminderSentFalse(user.getId(), AppointmentStatus.CONFIRMED);
        } else if (user.getRole() == Role.DOCTOR && user.getDoctor() != null) {
            due = appointments.findByDoctorIdAndStatusAndDoctorReminderSentFalse(user.getDoctor().getId(), AppointmentStatus.CONFIRMED);
        } else {
            return;
        }
        LocalDateTime now = LocalDateTime.now();
        for (Appointment a : due) {
            LocalDateTime when = LocalDateTime.of(a.getApptDate(), a.getApptTime());
            if (when.isAfter(now) && when.isBefore(now.plusHours(48))) {
                if (user.getRole() == Role.PATIENT) {
                    a.setPatientReminderSent(true);
                } else {
                    a.setDoctorReminderSent(true);
                }
                add(user, "Reminder: appointment " + Dates.display(a.getApptDate()) + " at " + a.getApptTime() + ".");
            }
        }
    }
}
