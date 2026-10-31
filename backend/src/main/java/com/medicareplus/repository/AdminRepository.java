package com.medicareplus.repository;

import com.medicareplus.model.Role;
import com.medicareplus.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/** Database access used only by the admin controller. */
public interface AdminRepository extends JpaRepository<User, Long> {

    long countByRole(Role role);

    List<User> findByRole(Role role);

    boolean existsByEmailIgnoreCase(String email);
}