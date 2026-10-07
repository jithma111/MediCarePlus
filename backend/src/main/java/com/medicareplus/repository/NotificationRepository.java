package com.medicareplus.repository;

import com.medicareplus.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findTop12ByUserIdOrderByCreatedAtDescIdDesc(Long userId);

    @Modifying
    @Query("update Notification n set n.seen = true where n.user.id = :userId and n.seen = false")
    int markAllSeen(@Param("userId") Long userId);

    void deleteByUserId(Long userId);
}
