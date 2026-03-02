package com.rescuelink.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record SupportRequest(
        @NotBlank(message = "Type is required")
        @Pattern(regexp = "ISSUE|FEEDBACK", message = "Type must be ISSUE or FEEDBACK")
        String type,

        @NotBlank(message = "Email is required")
        @Email(message = "Email is invalid")
        String email,

        @NotBlank(message = "Subject is required")
        @Size(max = 120, message = "Subject is too long")
        String subject,

        @NotBlank(message = "Message is required")
        @Size(max = 2000, message = "Message is too long")
        String message) {
}
