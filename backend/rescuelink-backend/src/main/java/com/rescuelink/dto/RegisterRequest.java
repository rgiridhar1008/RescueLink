package com.rescuelink.dto;

import com.rescuelink.entity.Role;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank
    private String name;

    @Email
    @NotBlank
    private String email;

    @NotBlank
    private String password;

    private String phone;
    private String city;
    private String bloodGroup;
    private String emergencyContact;

    private Role role = Role.USER;
}
