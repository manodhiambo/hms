package com.helvinotech.hms.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtTokenProvider {

    private final SecretKey key;
    private final long jwtExpiration;
    private final long refreshExpiration;

    public JwtTokenProvider(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration}") long jwtExpiration,
            @Value("${jwt.refresh-expiration}") long refreshExpiration) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.jwtExpiration = jwtExpiration;
        this.refreshExpiration = refreshExpiration;
    }

    public String generateToken(Authentication authentication, Long hospitalId) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        return buildToken(userDetails.getUsername(), jwtExpiration, hospitalId);
    }

    public String generateToken(String username, Long hospitalId) {
        return buildToken(username, jwtExpiration, hospitalId);
    }

    public String generateRefreshToken(String username, Long hospitalId) {
        return buildToken(username, refreshExpiration, hospitalId);
    }

    // Keep backward-compatible overloads (no hospitalId — used internally)
    public String generateToken(Authentication authentication) {
        return generateToken(authentication, null);
    }

    public String generateToken(String username) {
        return generateToken(username, null);
    }

    public String generateRefreshToken(String username) {
        return generateRefreshToken(username, null);
    }

    private String buildToken(String subject, long expiration, Long hospitalId) {
        Date now = new Date();
        JwtBuilder builder = Jwts.builder()
                .subject(subject)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expiration))
                .signWith(key);
        if (hospitalId != null) {
            builder.claim("hospitalId", hospitalId);
        }
        return builder.compact();
    }

    public String getUsernameFromToken(String token) {
        return getClaims(token).getSubject();
    }

    public Long getHospitalIdFromToken(String token) {
        try {
            return getClaims(token).get("hospitalId", Long.class);
        } catch (Exception e) {
            return null;
        }
    }

    private Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
