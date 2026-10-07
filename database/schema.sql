-- MediCare Plus - MySQL 8 schema
-- Optional: the backend creates these tables automatically (spring.jpa.hibernate.ddl-auto=update).
-- Run this script by hand only if you prefer to create the database yourself.

CREATE DATABASE IF NOT EXISTS medicare_plus CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE medicare_plus;

CREATE TABLE IF NOT EXISTS doctors (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    name              VARCHAR(120) NOT NULL,
    specialty         VARCHAR(100) NOT NULL,
    hospital          VARCHAR(150) NOT NULL,
    years_experience  INT          NOT NULL,
    qualifications    VARCHAR(255),
    bio               VARCHAR(1000),
    active            TINYINT(1)   NOT NULL DEFAULT 1,
    PRIMARY KEY (id)
) ENGINE=InnoDB;

-- 0 = Sunday ... 6 = Saturday
CREATE TABLE IF NOT EXISTS doctor_available_days (
    doctor_id    BIGINT NOT NULL,
    day_of_week  INT    NOT NULL,
    PRIMARY KEY (doctor_id, day_of_week),
    CONSTRAINT fk_days_doctor FOREIGN KEY (doctor_id) REFERENCES doctors (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS users (
    id             BIGINT       NOT NULL AUTO_INCREMENT,
    email          VARCHAR(120) NOT NULL,
    password_hash  VARCHAR(255) NOT NULL,          -- BCrypt hash, never the plain password
    name           VARCHAR(120) NOT NULL,
    role           VARCHAR(20)  NOT NULL,          -- PATIENT | DOCTOR | ADMIN
    doctor_id      BIGINT       NULL,              -- set for DOCTOR accounts
    PRIMARY KEY (id),
    UNIQUE KEY uk_users_email (email),
    CONSTRAINT fk_users_doctor FOREIGN KEY (doctor_id) REFERENCES doctors (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS appointments (
    id                     BIGINT       NOT NULL AUTO_INCREMENT,
    doctor_id              BIGINT       NOT NULL,
    patient_id             BIGINT       NOT NULL,
    appointment_date       DATE         NOT NULL,
    appointment_time       TIME         NOT NULL,
    reason                 VARCHAR(120) NOT NULL,
    status                 VARCHAR(20)  NOT NULL,   -- PENDING | CONFIRMED | COMPLETED | CANCELLED
    patient_reminder_sent  TINYINT(1)   NOT NULL DEFAULT 0,
    doctor_reminder_sent   TINYINT(1)   NOT NULL DEFAULT 0,
    created_at             DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    KEY idx_appt_slot (doctor_id, appointment_date, appointment_time),
    CONSTRAINT fk_appt_doctor  FOREIGN KEY (doctor_id)  REFERENCES doctors (id),
    CONSTRAINT fk_appt_patient FOREIGN KEY (patient_id) REFERENCES users (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notifications (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    user_id     BIGINT       NOT NULL,
    message     VARCHAR(500) NOT NULL,
    seen        TINYINT(1)   NOT NULL DEFAULT 0,
    created_at  DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    KEY idx_notif_user (user_id),
    CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS contact_messages (
    id          BIGINT        NOT NULL AUTO_INCREMENT,
    name        VARCHAR(120)  NOT NULL,
    email       VARCHAR(120)  NOT NULL,
    message     VARCHAR(2000) NOT NULL,
    created_at  DATETIME(6)   NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB;

-- Demo doctors and accounts (admin@demo.com, patient@demo.com, doctor@demo.com) are inserted
-- automatically by the backend (DataSeeder) on first start, because their passwords must be BCrypt-hashed.
