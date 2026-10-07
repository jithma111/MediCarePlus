package com.medicareplus.config;

import com.medicareplus.model.Doctor;
import com.medicareplus.model.Role;
import com.medicareplus.model.User;
import com.medicareplus.repository.DoctorRepository;
import com.medicareplus.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.LinkedHashSet;
import java.util.Set;

/** Inserts the demo doctors and demo accounts the first time the app starts on an empty database. */
@Component
public class DataSeeder implements CommandLineRunner {

    private final DoctorRepository doctors;
    private final UserRepository users;
    private final PasswordEncoder encoder;

    public DataSeeder(DoctorRepository doctors, UserRepository users, PasswordEncoder encoder) {
        this.doctors = doctors;
        this.users = users;
        this.encoder = encoder;
    }

    @Override
    public void run(String... args) {
        if (doctors.count() == 0) {
            Doctor perera = doctor("Dr. Amara Perera", "General practice", "City General Hospital", 14,
                    "MBBS, MD (Family Medicine)",
                    "Family doctor focused on prevention, chronic conditions and everyday care.", 1, 2, 3, 4, 5);
            doctor("Dr. Rohan Silva", "Cardiology", "Heart Care Centre", 18, "MBBS, MD, DM (Cardiology)",
                    "Treats heart rhythm problems, blood pressure and cholesterol.", 1, 3, 5);
            doctor("Dr. Nadia Fernando", "Paediatrics", "Lakeside Children's Hospital", 10,
                    "MBBS, DCH, MD (Paediatrics)",
                    "Gentle care for babies, children and teenagers, including vaccinations.", 1, 2, 3, 4, 5);
            doctor("Dr. Kasun Jayasuriya", "Dermatology", "City General Hospital", 9, "MBBS, MD (Dermatology)",
                    "Skin, hair and nail conditions, including acne and eczema.", 2, 4, 5, 6);
            doctor("Dr. Meera Nair", "Gynaecology", "Lakeside Women's Clinic", 15,
                    "MBBS, MS (Obstetrics & Gynaecology)",
                    "Women's health, pregnancy care and family planning.", 1, 2, 4, 6);
            doctor("Dr. David Wickrama", "Orthopaedics", "Heart Care Centre", 12, "MBBS, MS (Orthopaedics)",
                    "Bone, joint and sports injuries, from diagnosis to rehabilitation.", 1, 2, 3, 4);

            if (!users.existsByEmailIgnoreCase("doctor@demo.com")) {
                users.save(new User("doctor@demo.com", encoder.encode("demo123"), perera.getName(), Role.DOCTOR, perera));
            }
        }
        if (!users.existsByEmailIgnoreCase("admin@demo.com")) {
            users.save(new User("admin@demo.com", encoder.encode("admin123"), "Administrator", Role.ADMIN, null));
        }
        if (!users.existsByEmailIgnoreCase("patient@demo.com")) {
            users.save(new User("patient@demo.com", encoder.encode("demo123"), "Demo Patient", Role.PATIENT, null));
        }
    }

    private Doctor doctor(String name, String specialty, String hospital, int years, String qualifications,
                          String bio, Integer... days) {
        Doctor d = new Doctor();
        d.setName(name);
        d.setSpecialty(specialty);
        d.setHospital(hospital);
        d.setYearsExperience(years);
        d.setQualifications(qualifications);
        d.setBio(bio);
        Set<Integer> set = new LinkedHashSet<>(java.util.Arrays.asList(days));
        d.setAvailableDays(set);
        return doctors.save(d);
    }
}
