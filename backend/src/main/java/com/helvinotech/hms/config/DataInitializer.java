package com.helvinotech.hms.config;

import com.helvinotech.hms.entity.Hospital;
import com.helvinotech.hms.entity.User;
import com.helvinotech.hms.enums.SubscriptionStatus;
import com.helvinotech.hms.enums.UserRole;
import com.helvinotech.hms.repository.HospitalRepository;
import com.helvinotech.hms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private static final String ADMIN_EMAIL    = "helvinotechltd@gmail.com";
    private static final String ADMIN_PASSWORD = "Mycat@95";
    private static final String ADMIN_NAME     = "Helvino Technologies";

    private static final String DEMO_HOSPITAL_SLUG = "demo-hospital";
    private static final String DEMO_PASSWORD      = "Demo@2025";

    private final UserRepository userRepository;
    private final HospitalRepository hospitalRepository;
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
        ensureDemoHospital();
    }

    /**
     * Truncates all clinical/operational tables and resets their ID sequences.
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
                "beds, rooms, wards, refunds, medical_services " +
                "RESTART IDENTITY CASCADE"
            );
            log.warn("All operational data wiped successfully. Remove CLEAN_DATA env var now.");
        } catch (Exception e) {
            log.error("Data cleanup failed", e);
        }
    }

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
                if (changed) { userRepository.save(existing); log.info("Admin user updated: {}", ADMIN_EMAIL); }
                else         { log.info("Admin user OK: {}", ADMIN_EMAIL); }
            }, () -> {
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

    /**
     * Creates a permanent demo hospital with demo user accounts.
     * Demo users: demo-admin, demo-doctor, demo-nurse (all password Demo@2025).
     * The demo hospital is ACTIVE with a far-future expiry so it never expires.
     */
    private void ensureDemoHospital() {
        try {
            Hospital demo = hospitalRepository.findBySlug(DEMO_HOSPITAL_SLUG).orElseGet(() -> {
                Hospital h = Hospital.builder()
                        .name("Demo Hospital")
                        .slug(DEMO_HOSPITAL_SLUG)
                        .email("demo@helvino.org")
                        .phone("0110421320")
                        .contactPerson("Demo User")
                        .county("Nairobi")
                        .address("Demo Address, Nairobi")
                        .active(true)
                        .subscriptionStatus(SubscriptionStatus.ACTIVE)
                        .subscriptionExpiresAt(LocalDateTime.now().plusYears(100))
                        .notes("Demo hospital — for demonstrations only")
                        .build();
                h = hospitalRepository.save(h);
                log.info("Demo hospital created with id={}", h.getId());
                return h;
            });

            ensureDemoUser(demo.getId(), "demo-admin@helvino.org",  "Demo Admin",   UserRole.HOSPITAL_ADMIN);
            ensureDemoUser(demo.getId(), "demo-doctor@helvino.org", "Demo Doctor",  UserRole.DOCTOR);
            ensureDemoUser(demo.getId(), "demo-nurse@helvino.org",  "Demo Nurse",   UserRole.NURSE);
        } catch (Exception e) {
            log.error("Demo hospital setup failed — app will continue", e);
        }
    }

    private void ensureDemoUser(Long hospitalId, String email, String fullName, UserRole role) {
        userRepository.findByEmail(email).ifPresentOrElse(u -> {
            boolean changed = false;
            if (!u.isActive()) { u.setActive(true); changed = true; }
            if (!passwordEncoder.matches(DEMO_PASSWORD, u.getPasswordHash())) {
                u.setPasswordHash(passwordEncoder.encode(DEMO_PASSWORD));
                u.setPlainPassword(DEMO_PASSWORD);
                changed = true;
            }
            if (changed) userRepository.save(u);
        }, () -> {
            User user = User.builder()
                    .fullName(fullName)
                    .email(email)
                    .passwordHash(passwordEncoder.encode(DEMO_PASSWORD))
                    .plainPassword(DEMO_PASSWORD)
                    .role(role)
                    .hospitalId(hospitalId)
                    .active(true)
                    .department("Demo")
                    .build();
            userRepository.save(user);
            log.info("Demo user created: {}", email);
        });
    }
}
