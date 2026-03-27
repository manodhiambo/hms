package com.helvinotech.hms.repository;

import com.helvinotech.hms.entity.User;
import com.helvinotech.hms.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    // Global queries (SUPER_ADMIN)
    List<User> findByRole(UserRole role);
    List<User> findByActiveTrue();

    // Tenant-scoped queries
    List<User> findByHospitalId(Long hospitalId);
    List<User> findByHospitalIdAndRole(Long hospitalId, UserRole role);
    List<User> findByHospitalIdAndActiveTrue(Long hospitalId);
    Optional<User> findByIdAndHospitalId(Long id, Long hospitalId);
}
