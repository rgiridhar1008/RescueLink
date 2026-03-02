package com.rescuelink.service;

import com.rescuelink.dto.AuthRequest;
import com.rescuelink.dto.AuthResponse;
import com.rescuelink.dto.ChangePasswordRequest;
import com.rescuelink.dto.ForgotPasswordRequest;
import com.rescuelink.dto.RegisterRequest;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(AuthRequest request);
    AuthResponse changePassword(ChangePasswordRequest request);
    AuthResponse forgotPassword(ForgotPasswordRequest request);
}
