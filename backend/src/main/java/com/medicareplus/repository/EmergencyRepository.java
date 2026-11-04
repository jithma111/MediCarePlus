package com.medicareplus.repository;

import com.medicareplus.model.EmergencyRequest;
import com.medicareplus.model.EmergencyRequest.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EmergencyRepository extends JpaRepository<EmergencyRequest, Long> {
    List<EmergencyRequest> findByPatientIdOrderByCreatedAtDesc(Long patientId);

    List<EmergencyRequest> findByStatusAndDriverIsNull(Status status);
    List<EmergencyRequest> findByDriverIdOrderByCreatedAtDesc(Long driverId);

}