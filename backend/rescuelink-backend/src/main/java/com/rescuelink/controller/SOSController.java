package com.rescuelink.controller;

import java.util.List;
import java.util.Map;

import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.rescuelink.dto.SOSRequest;
import com.rescuelink.entity.SOSAlert;
import com.rescuelink.service.SOSService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/sos")
@Validated
@RequiredArgsConstructor
public class SOSController {

    private final SOSService sosService;

    @PostMapping("/trigger")
    public Map<String, Object> trigger(@Valid @RequestBody SOSRequest request) {
        SOSAlert alert = sosService.triggerAlert(request);
        String requesterType = alert.getUserId() == null ? "GUEST" : "USER";
        return Map.of(
                "message", "SOS alert triggered successfully",
                "requesterType", requesterType,
                "alert", alert
        );
    }

    @GetMapping("/my")
    public List<SOSAlert> myAlerts(@RequestParam Long userId) {
        return sosService.getAlertsByUserId(userId);
    }

    @GetMapping("/user/{userId}")
    public List<SOSAlert> userAlerts(@PathVariable Long userId) {
        return sosService.getAlertsByUserId(userId);
    }
}
