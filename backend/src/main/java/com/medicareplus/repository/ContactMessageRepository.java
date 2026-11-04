package com.medicareplus.repository;

import com.medicareplus.model.ContactMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ContactMessageRepository extends JpaRepository<ContactMessage, Long> {
    List<ContactMessage> findBySenderIdOrderByCreatedAtDesc(Long senderId);
    List<ContactMessage> findAllByOrderByCreatedAtDesc();
}
