package com.rescuelink.controller;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.rescuelink.dto.SupportRequest;
import com.rescuelink.entity.Role;
import com.rescuelink.repository.UserRepository;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/support")
@Validated
@RequiredArgsConstructor
@Slf4j
public class SupportController {

    private final JavaMailSender mailSender;
    private final UserRepository userRepository;

    @Value("${alert.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${alert.mail.from:no-reply@rescuelink.local}")
    private String fromAddress;

    @Value("${alert.mail.recipients:}")
    private String configuredRecipients;

    @PostMapping
    public Map<String, Object> submit(@Valid @RequestBody SupportRequest request) {
        notifyAdmins(request);
        return Map.of(
                "submitted", true,
                "type", request.type(),
                "email", request.email(),
                "subject", request.subject(),
                "createdAt", LocalDateTime.now().toString());
    }

    private void notifyAdmins(SupportRequest request) {
        if (!mailEnabled) {
            return;
        }

        List<String> recipients = resolveRecipients();
        if (recipients.isEmpty()) {
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(recipients.toArray(String[]::new));
            message.setSubject("RescueLink Support " + request.type() + ": " + request.subject());
            message.setText("""
                    A new support submission was received.

                    Type: %s
                    From: %s
                    Subject: %s
                    Message:
                    %s
                    """
                    .formatted(request.type(), request.email(), request.subject(), request.message()));
            mailSender.send(message);
        } catch (MailException ex) {
            log.warn("Failed to send support email notification: {}", ex.getMessage());
        }
    }

    private List<String> resolveRecipients() {
        Set<String> recipients = new LinkedHashSet<>();

        if (configuredRecipients != null && !configuredRecipients.isBlank()) {
            recipients.addAll(
                    Arrays.stream(configuredRecipients.split(","))
                            .map(String::trim)
                            .filter(s -> !s.isBlank())
                            .collect(Collectors.toSet()));
        }

        recipients.addAll(
                userRepository.findByRoleAndActiveTrue(Role.ADMIN).stream()
                        .map(user -> user.getEmail())
                        .filter(email -> email != null && !email.isBlank())
                        .collect(Collectors.toSet()));

        return List.copyOf(recipients);
    }
}
