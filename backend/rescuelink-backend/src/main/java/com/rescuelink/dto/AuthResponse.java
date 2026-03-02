package com.rescuelink.dto;

import com.rescuelink.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
public class AuthResponse {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String bloodGroup;
    private String emergencyContact;
    private Role role;
    private Boolean active;
    private LocalDateTime lastLogin;
    private String message;
}
