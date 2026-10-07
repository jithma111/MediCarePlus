package com.medicareplus.repository;

import com.medicareplus.model.Appointment;
import com.medicareplus.model.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByPatientIdOrderByApptDateAscApptTimeAsc(Long patientId);

    List<Appointment> findByDoctorIdOrderByApptDateAscApptTimeAsc(Long doctorId);

    List<Appointment> findAllByOrderByApptDateDescApptTimeDesc();

    List<Appointment> findByDoctorIdAndStatusNot(Long doctorId, AppointmentStatus status);

    List<Appointment> findByDoctorIdAndStatusIn(Long doctorId, Collection<AppointmentStatus> statuses);

    List<Appointment> findByPatientIdAndStatusAndPatientReminderSentFalse(Long patientId, AppointmentStatus status);

    List<Appointment> findByDoctorIdAndStatusAndDoctorReminderSentFalse(Long doctorId, AppointmentStatus status);

    /** Number of non-cancelled appointments in a slot (ignoring one appointment id, used when rescheduling). */
    @Query("select count(a) from Appointment a "
            + "where a.doctor.id = :doctorId and a.apptDate = :day and a.apptTime = :slot "
            + "and a.status <> :cancelled and a.id <> :excludeId")
    long countInSlot(@Param("doctorId") Long doctorId,
                     @Param("day") LocalDate day,
                     @Param("slot") LocalTime slot,
                     @Param("cancelled") AppointmentStatus cancelled,
                     @Param("excludeId") Long excludeId);
}
