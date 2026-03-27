package com.helvinotech.hms.config;

import com.helvinotech.hms.entity.User;
import com.helvinotech.hms.enums.UserRole;
import com.helvinotech.hms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private static final String ADMIN_EMAIL = "rayvonmbira@gmail.com";
    private static final String ADMIN_PASSWORD = "Rayvon@123";
    private static final String ADMIN_NAME = "Rayvon Mbira";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    @Value("${CLEAN_DATA:false}")
    private boolean cleanData;

    @Value("${CLEAN_USERS:false}")
    private boolean cleanUsers;

    @Override
    public void run(String... args) {
        if (cleanData) {
            clearAllData();
        }
        if (cleanUsers) {
            deleteNonAdminUsers();
        }
        ensureAdminUser();
    }

    /**
     * Truncates all clinical/operational tables and resets their ID sequences.
     * Leaves the users table intact so the admin account survives.
     * Triggered only when the CLEAN_DATA=true environment variable is set on Render.
     * Remove CLEAN_DATA after the first successful deploy to prevent re-running.
     */
    private void clearAllData() {
        try {
            log.warn("CLEAN_DATA=true — wiping all operational data...");
            jdbcTemplate.execute(
                "TRUNCATE TABLE " +
                "nursing_notes, admissions, " +
                "billing_items, payments, insurance_claims, billings, " +
                "imaging_orders, lab_orders, prescriptions, " +
                "visits, appointments, notifications, activity_logs, expenses, " +
                "patients, drugs, lab_tests, insurance_companies, " +
                "beds, rooms, wards " +
                "RESTART IDENTITY CASCADE"
            );
            log.warn("All operational data wiped successfully. Remove CLEAN_DATA env var now.");
        } catch (Exception e) {
            log.error("Data cleanup failed", e);
        }
    }

    /**
     * Deletes all users except the admin account.
     * Triggered only when CLEAN_USERS=true is set on Render.
     * Remove CLEAN_USERS after the first successful deploy to prevent re-running.
     */
    private void deleteNonAdminUsers() {
        try {
            log.warn("CLEAN_USERS=true — deleting all non-admin users...");
            jdbcTemplate.update("DELETE FROM users WHERE email != ?", ADMIN_EMAIL);
            log.warn("Non-admin users deleted. Remove CLEAN_USERS env var now.");
        } catch (Exception e) {
            log.error("User cleanup failed", e);
        }
    }

    private void ensureAdminUser() {
        try {
            userRepository.findByEmail(ADMIN_EMAIL).ifPresentOrElse(existing -> {
                boolean changed = false;
                if (!existing.isActive()) { existing.setActive(true); changed = true; }
                if (existing.getRole() != UserRole.SUPER_ADMIN) { existing.setRole(UserRole.SUPER_ADMIN); changed = true; }
                if (!ADMIN_NAME.equals(existing.getFullName())) { existing.setFullName(ADMIN_NAME); changed = true; }
                if (!passwordEncoder.matches(ADMIN_PASSWORD, existing.getPasswordHash())) {
                    existing.setPasswordHash(passwordEncoder.encode(ADMIN_PASSWORD));
                    existing.setPlainPassword(ADMIN_PASSWORD);
                    changed = true;
                }
                if (existing.getPlainPassword() == null) { existing.setPlainPassword(ADMIN_PASSWORD); changed = true; }
                if (changed) {
                    userRepository.save(existing);
                    log.info("Admin user updated: {}", ADMIN_EMAIL);
                } else {
                    log.info("Admin user OK: {}", ADMIN_EMAIL);
                }
            }, () -> {
                // Deactivate any old SUPER_ADMIN accounts before creating the new one
                userRepository.findAll().stream()
                        .filter(u -> u.getRole() == UserRole.SUPER_ADMIN)
                        .forEach(u -> { u.setActive(false); userRepository.save(u); });

                User admin = User.builder()
                        .fullName(ADMIN_NAME)
                        .email(ADMIN_EMAIL)
                        .passwordHash(passwordEncoder.encode(ADMIN_PASSWORD))
                        .plainPassword(ADMIN_PASSWORD)
                        .phone("")
                        .role(UserRole.SUPER_ADMIN)
                        .department("Administration")
                        .active(true)
                        .build();
                userRepository.save(admin);
                log.info("Admin user created: {}", ADMIN_EMAIL);
            });
        } catch (Exception e) {
            log.error("Admin user setup failed — app will continue", e);
        }
    }
}
