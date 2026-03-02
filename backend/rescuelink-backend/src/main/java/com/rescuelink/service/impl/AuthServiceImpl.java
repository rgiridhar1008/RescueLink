package com.rescuelink.service.impl;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;

import com.rescuelink.dto.AuthRequest;
import com.rescuelink.dto.AuthResponse;
import com.rescuelink.dto.ChangePasswordRequest;
import com.rescuelink.dto.ForgotPasswordRequest;
import com.rescuelink.dto.RegisterRequest;
import com.rescuelink.entity.BloodDonor;
import com.rescuelink.entity.DonorAvailability;
import com.rescuelink.entity.User;
import com.rescuelink.exception.BadRequestException;
import com.rescuelink.repository.BloodDonorRepository;
import com.rescuelink.repository.UserRepository;
import com.rescuelink.service.AuthService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final BloodDonorRepository donorRepository;

    @Override
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already registered");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(request.getPassword())
                .phone(request.getPhone())
                .bloodGroup(request.getBloodGroup())
                .emergencyContact(request.getEmergencyContact())
                .role(request.getRole())
                .active(true)
                .build();

        User saved = userRepository.save(user);

        if (saved.getBloodGroup() != null && !saved.getBloodGroup().isBlank()
                && saved.getPhone() != null && !saved.getPhone().isBlank()
                && !donorRepository.existsByPhone(saved.getPhone())) {
            BloodDonor donor = BloodDonor.builder()
                    .name(saved.getName())
                    .bloodGroup(saved.getBloodGroup())
                    .city(request.getCity() == null || request.getCity().isBlank() ? "Not specified" : request.getCity().trim())
                    .phone(saved.getPhone())
                    .verified(false)
                    .availability(DonorAvailability.AVAILABLE)
                    .build();
            donorRepository.save(donor);
        }

        return AuthResponse.builder()
                .id(saved.getId())
                .name(saved.getName())
                .email(saved.getEmail())
                .phone(saved.getPhone())
                .bloodGroup(saved.getBloodGroup())
                .emergencyContact(saved.getEmergencyContact())
                .role(saved.getRole())
                .active(saved.getActive())
                .lastLogin(saved.getLastLogin())
                .message("Registration successful")
                .build();
    }

    @Override
    public AuthResponse login(AuthRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("Invalid email or password"));

        if (!user.getPassword().equals(request.getPassword())) {
            throw new BadRequestException("Invalid email or password");
        }
        if (Boolean.FALSE.equals(user.getActive())) {
            throw new BadRequestException("Account is deactivated. Contact admin.");
        }

        user.setLastLogin(LocalDateTime.now());
        User saved = userRepository.save(user);

        return AuthResponse.builder()
                .id(saved.getId())
                .name(saved.getName())
                .email(saved.getEmail())
                .phone(saved.getPhone())
                .bloodGroup(saved.getBloodGroup())
                .emergencyContact(saved.getEmergencyContact())
                .role(saved.getRole())
                .active(saved.getActive())
                .lastLogin(saved.getLastLogin())
                .message("Login successful")
                .build();
    }

    @Override
    public AuthResponse changePassword(ChangePasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("Account not found"));

        if (!user.getPassword().equals(request.getCurrentPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }
        if (request.getNewPassword() == null || request.getNewPassword().length() < 8) {
            throw new BadRequestException("New password must be at least 8 characters");
        }

        user.setPassword(request.getNewPassword());
        User saved = userRepository.save(user);

        return AuthResponse.builder()
                .id(saved.getId())
                .name(saved.getName())
                .email(saved.getEmail())
                .phone(saved.getPhone())
                .bloodGroup(saved.getBloodGroup())
                .emergencyContact(saved.getEmergencyContact())
                .role(saved.getRole())
                .active(saved.getActive())
                .lastLogin(saved.getLastLogin())
                .message("Password changed successfully")
                .build();
    }

    @Override
    public AuthResponse forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("Account not found"));

        if (request.getNewPassword() == null || request.getNewPassword().length() < 8) {
            throw new BadRequestException("New password must be at least 8 characters");
        }

        user.setPassword(request.getNewPassword());
        User saved = userRepository.save(user);

        return AuthResponse.builder()
                .id(saved.getId())
                .name(saved.getName())
                .email(saved.getEmail())
                .phone(saved.getPhone())
                .bloodGroup(saved.getBloodGroup())
                .emergencyContact(saved.getEmergencyContact())
                .role(saved.getRole())
                .active(saved.getActive())
                .lastLogin(saved.getLastLogin())
                .message("Password reset successful")
                .build();
    }
}
