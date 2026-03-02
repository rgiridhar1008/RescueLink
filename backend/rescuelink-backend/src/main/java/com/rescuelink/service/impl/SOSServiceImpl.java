package com.rescuelink.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;

import com.rescuelink.dto.SOSRequest;
import com.rescuelink.entity.SOSAlert;
import com.rescuelink.exception.ResourceNotFoundException;
import com.rescuelink.repository.SOSAlertRepository;
import com.rescuelink.service.NotificationService;
import com.rescuelink.service.SOSService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SOSServiceImpl implements SOSService {

    private final SOSAlertRepository sosAlertRepository;
    private final NotificationService notificationService;

    @Override
    public SOSAlert triggerAlert(SOSRequest request) {
        SOSAlert alert = SOSAlert.builder()
                .userId(request.getUserId())
                .message(request.getMessage())
                .location(request.getLocation())
                .status("OPEN")
                .build();
        SOSAlert saved = sosAlertRepository.save(alert);
        notificationService.notifySOS(saved);
        return saved;
    }

    @Override
    public List<SOSAlert> getAllAlerts() {
        return sosAlertRepository.findAll();
    }

    @Override
    public List<SOSAlert> getAlertsByUserId(Long userId) {
        return sosAlertRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Override
    public SOSAlert updateAlertStatus(Long id, String status) {
        SOSAlert alert = sosAlertRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SOS alert not found: " + id));
        String normalized = normalizeStatus(status);
        alert.setStatus(normalized);
        return sosAlertRepository.save(alert);
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            return "OPEN";
        }
        String value = status.trim().toUpperCase();
        return switch (value) {
            case "OPEN", "IN_PROGRESS", "RESOLVED", "CRITICAL" -> value;
            default -> "OPEN";
        };
    }
}
