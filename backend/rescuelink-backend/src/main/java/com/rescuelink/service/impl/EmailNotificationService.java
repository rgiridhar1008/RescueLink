package com.rescuelink.service.impl;

import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import com.rescuelink.entity.Role;
import com.rescuelink.entity.SOSAlert;
import com.rescuelink.repository.UserRepository;
import com.rescuelink.service.NotificationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailNotificationService implements NotificationService {

    private final JavaMailSender mailSender;
    private final UserRepository userRepository;

    @Value("${alert.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${alert.mail.from:no-reply@rescuelink.local}")
    private String fromAddress;

    @Value("${alert.mail.recipients:}")
    private String configuredRecipients;

    @Override
    public void notifySOS(SOSAlert alert) {
        if (!mailEnabled) {
            return;
        }

        List<String> recipients = resolveRecipients();
        if (recipients.isEmpty()) {
            log.info("SOS email skipped: no recipients configured.");
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(recipients.toArray(String[]::new));
            message.setSubject("RescueLink SOS Alert #" + alert.getId());
            message.setText(buildBody(alert));
            mailSender.send(message);
        } catch (MailException ex) {
            log.warn("Failed to send SOS email notification: {}", ex.getMessage());
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

    private String buildBody(SOSAlert alert) {
        String requester = alert.getUserId() == null ? "Guest SOS" : "User ID: " + alert.getUserId();
        return """
                Emergency SOS triggered.

                Alert ID: %d
                Requester: %s
                Location: %s
                Status: %s
                Message: %s
                Created At: %s
                """
                .formatted(
                        alert.getId(),
                        requester,
                        alert.getLocation(),
                        alert.getStatus(),
                        alert.getMessage(),
                        alert.getCreatedAt());
    }
}

