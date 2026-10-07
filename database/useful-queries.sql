-- Handy queries while developing (MySQL Workbench or IntelliJ Database tool window)
USE medicare_plus;

-- All appointments with names
SELECT a.id, d.name AS doctor, u.name AS patient, a.appointment_date, a.appointment_time, a.status
FROM appointments a
JOIN doctors d ON d.id = a.doctor_id
JOIN users   u ON u.id = a.patient_id
ORDER BY a.appointment_date, a.appointment_time;

-- Booked slots for one doctor
SELECT appointment_date, appointment_time FROM appointments WHERE doctor_id = 1 AND status <> 'CANCELLED';

-- Contact form messages
SELECT * FROM contact_messages ORDER BY created_at DESC;
