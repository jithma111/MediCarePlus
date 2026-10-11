package com.medicareplus.repository;

import com.medicareplus.model.EmergencyRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EmergencyRepository extends JpaRepository<EmergencyRequest, Long> {
    List<EmergencyRequest> findByPatientIdOrderByCreatedAtDesc(Long patientId);
}