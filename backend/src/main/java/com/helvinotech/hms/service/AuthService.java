package com.helvinotech.hms.service;

import com.helvinotech.hms.dto.AuthRequest;
import com.helvinotech.hms.dto.AuthResponse;
import com.helvinotech.hms.entity.Hospital;
import com.helvinotech.hms.entity.User;
import com.helvinotech.hms.enums.SubscriptionStatus;
import com.helvinotech.hms.exception.BadRequestException;
import com.helvinotech.hms.repository.HospitalRepository;
import com.helvinotech.hms.repository.UserRepository;
import com.helvinotech.hms.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final HospitalRepository hospitalRepository;
    private final ActivityLogService activityLogService;

    @Transactional(readOnly = false)
    public AuthResponse login(AuthRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail()).orElseThrow();
        Long hospitalId = user.getHospitalId();

        // Check hospital subscription if user belongs to one
        if (hospitalId != null) {
            Hospital hospital = hospitalRepository.findById(hospitalId).orElse(null);
            if (hospital != null) {
                // Auto-expire trial if time is up
                if (hospital.getSubscriptionStatus() == SubscriptionStatus.TRIAL
                        && hospital.getTrialEndsAt() != null
                        && hospital.getTrialEndsAt().isBefore(LocalDateTime.now())) {
                    hospital.setActive(false);
                    hospital.setSubscriptionStatus(SubscriptionStatus.EXPIRED);
                    hospitalRepository.save(hospital);
                    throw new BadRequestException("Your 5-day free trial has expired. Please make payment to activate your account. " +
                            "Paybill: 522533, Account: 8071524. Contact: 0110421320 or info@helvino.org");
                }
                if (!hospital.isActive()) {
                    String status = hospital.getSubscriptionStatus().name();
                    if (status.equals("EXPIRED")) {
                        throw new BadRequestException("Your account has expired. Please make payment to reactivate. " +
                                "Paybill: 522533, Account: 8071524. Contact: 0110421320 or info@helvino.org");
                    }
                    throw new BadRequestException("Your hospital account has been deactivated. Contact support: 0110421320 or info@helvino.org");
                }
            }
        }

        String token = tokenProvider.generateToken(authentication, hospitalId);
        String refreshToken = tokenProvider.generateRefreshToken(request.getEmail(), hospitalId);

        activityLogService.log(user, "LOGIN", "User", user.getId(),
                "User logged in: " + user.getEmail(), null);

        String hospitalName = null;
        if (hospitalId != null) {
            hospitalName = hospitalRepository.findById(hospitalId)
                    .map(Hospital::getName).orElse(null);
        }

        return AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .hospitalId(hospitalId)
                .hospitalName(hospitalName)
                .build();
    }

    public AuthResponse refreshToken(String refreshToken) {
        if (!tokenProvider.validateToken(refreshToken)) {
            throw new RuntimeException("Invalid refresh token");
        }
        String username = tokenProvider.getUsernameFromToken(refreshToken);
        User user = userRepository.findByEmail(username).orElseThrow();
        Long hospitalId = user.getHospitalId();

        String newToken = tokenProvider.generateToken(username, hospitalId);
        String newRefreshToken = tokenProvider.generateRefreshToken(username, hospitalId);

        String hospitalName = null;
        if (hospitalId != null) {
            hospitalName = hospitalRepository.findById(hospitalId)
                    .map(Hospital::getName).orElse(null);
        }

        return AuthResponse.builder()
                .token(newToken)
                .refreshToken(newRefreshToken)
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .hospitalId(hospitalId)
                .hospitalName(hospitalName)
                .build();
    }
}
