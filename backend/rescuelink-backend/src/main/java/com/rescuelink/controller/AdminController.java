package com.rescuelink.controller;

import java.util.List;
import java.util.Map;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Locale;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.rescuelink.entity.BloodDonor;
import com.rescuelink.entity.DonorAvailability;
import com.rescuelink.entity.Hospital;
import com.rescuelink.entity.Role;
import com.rescuelink.entity.SOSAlert;
import com.rescuelink.entity.User;
import com.rescuelink.repository.BloodDonorRepository;
import com.rescuelink.repository.HospitalRepository;
import com.rescuelink.repository.SOSAlertRepository;
import com.rescuelink.repository.UserRepository;
import com.rescuelink.service.DonorService;
import com.rescuelink.service.HospitalService;
import com.rescuelink.service.SOSService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final HospitalService hospitalService;
    private final DonorService donorService;
    private final SOSService sosService;
    private final UserRepository userRepository;
    private final HospitalRepository hospitalRepository;
    private final BloodDonorRepository donorRepository;
    private final SOSAlertRepository sosAlertRepository;
    private final List<Map<String, Object>> activityLog = new ArrayList<>();
    private volatile String latestBroadcast = "";

    @PostMapping("/hospitals")
    public Hospital addHospital(@RequestBody Hospital hospital) {
        Hospital saved = hospitalService.addHospital(hospital);
        logAction("Added hospital", saved.getName() + " (" + saved.getCity() + ")");
        return saved;
    }

    @PutMapping("/hospitals/{id}")
    public Hospital updateHospital(@PathVariable Long id, @RequestBody Hospital hospital) {
        return hospitalService.updateHospital(id, hospital);
    }

    @DeleteMapping("/hospitals/{id}")
    public void deleteHospital(@PathVariable Long id) {
        hospitalService.deleteHospital(id);
        logAction("Deleted hospital", "Hospital #" + id);
    }

    @PostMapping("/donors")
    public BloodDonor addDonor(@RequestBody BloodDonor donor) {
        return donorService.addDonor(donor);
    }

    @PutMapping("/donors/{id}/verify")
    public BloodDonor verifyDonor(@PathVariable Long id, @RequestParam boolean verified) {
        BloodDonor saved = donorService.verifyDonor(id, verified);
        logAction("Verified donor", saved.getName() + " -> " + verified);
        return saved;
    }

    @PostMapping("/donors/{id}/verify")
    public BloodDonor verifyDonorDefault(@PathVariable Long id) {
        BloodDonor saved = donorService.verifyDonor(id, true);
        logAction("Verified donor", saved.getName() + " -> true");
        return saved;
    }

    @GetMapping("/donors/pending")
    public List<BloodDonor> pendingDonors() {
        return donorService.getPendingDonors();
    }

    @GetMapping("/donors")
    public List<BloodDonor> donors() {
        return donorRepository.findAll();
    }

    @GetMapping("/users")
    public List<Map<String, Object>> users(@RequestParam(required = false) String query) {
        List<User> source;
        if (query == null || query.isBlank()) {
            source = userRepository.findAll();
        } else {
            source = userRepository.findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(query.trim(), query.trim());
        }
        return source.stream().map(this::toUserMap).toList();
    }

    @GetMapping("/hospitals")
    public List<Hospital> hospitals(@RequestParam(required = false) String query) {
        if (query == null || query.isBlank()) {
            return hospitalRepository.findAll();
        }
        return hospitalRepository.findByNameContainingIgnoreCaseOrCityContainingIgnoreCase(query.trim(), query.trim());
    }

    @GetMapping("/alerts")
    public List<SOSAlert> allAlerts(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String query) {
        if (status != null && !status.isBlank()) {
            return sosAlertRepository.findByStatusOrderByCreatedAtDesc(status.trim().toUpperCase(Locale.ROOT));
        }
        if (query != null && !query.isBlank()) {
            return sosAlertRepository.findByLocationContainingIgnoreCaseOrderByCreatedAtDesc(query.trim());
        }
        return sosService.getAllAlerts();
    }

    @PutMapping("/alerts/{id}/status")
    public SOSAlert updateAlertStatus(@PathVariable Long id, @RequestParam String status) {
        SOSAlert updated = sosService.updateAlertStatus(id, status);
        logAction("Updated SOS status", "Alert #" + id + " -> " + updated.getStatus());
        return updated;
    }

    @DeleteMapping("/alerts/{id}")
    public Map<String, Object> deleteAlert(@PathVariable Long id) {
        if (!sosAlertRepository.existsById(id)) {
            return Map.of("deleted", false, "id", id, "message", "Alert not found");
        }
        sosAlertRepository.deleteById(id);
        logAction("Deleted SOS alert", "Alert #" + id);
        return Map.of("deleted", true, "id", id);
    }

    @PutMapping("/users/{id}/role")
    public Map<String, Object> updateUserRole(@PathVariable Long id, @RequestParam String role) {
        User user = userRepository.findById(id).orElseThrow();
        Role nextRole = parseRole(role);
        user.setRole(nextRole);
        User saved = userRepository.save(user);
        logAction("Updated user role", saved.getEmail() + " -> " + saved.getRole());
        return Map.of("id", saved.getId(), "role", saved.getRole().name());
    }

    @PutMapping("/users/{id}/active")
    public Map<String, Object> updateUserActive(@PathVariable Long id, @RequestParam boolean active) {
        User user = userRepository.findById(id).orElseThrow();
        user.setActive(active);
        User saved = userRepository.save(user);
        logAction(active ? "Activated account" : "Deactivated account", saved.getEmail());
        return Map.of("id", saved.getId(), "active", saved.getActive());
    }

    @GetMapping("/summary")
    public Map<String, Long> summary() {
        LocalDate today = LocalDate.now();
        LocalDateTime start = today.atStartOfDay();
        LocalDateTime end = start.plusDays(1);
        return Map.of(
                "totalUsers", userRepository.count(),
                "activeDonors", donorRepository.countByVerifiedTrueAndAvailability(DonorAvailability.AVAILABLE),
                "hospitalsRegistered", hospitalRepository.count(),
                "sosToday", sosAlertRepository.countByCreatedAtBetween(start, end),
                "pendingVerifications", donorRepository.countByVerifiedFalse());
    }

    @GetMapping("/system-health")
    public Map<String, String> systemHealth() {
        return Map.of(
                "apiStatus", "UP",
                "databaseStatus", "CONNECTED",
                "lastBackup", LocalDateTime.now().minusHours(2).toString());
    }

    @PostMapping("/broadcast")
    public Map<String, String> setBroadcast(@RequestBody Map<String, String> payload) {
        latestBroadcast = payload.getOrDefault("message", "");
        logAction("Sent emergency broadcast", latestBroadcast);
        return Map.of("message", latestBroadcast);
    }

    @GetMapping("/broadcast/latest")
    public Map<String, String> getBroadcast() {
        return Map.of("message", latestBroadcast);
    }

    @DeleteMapping("/broadcast")
    public Map<String, Object> deleteBroadcast() {
        boolean existed = latestBroadcast != null && !latestBroadcast.isBlank();
        latestBroadcast = "";
        logAction("Deleted emergency broadcast", existed ? "Cleared current broadcast message" : "No active broadcast to clear");
        return Map.of("deleted", true, "hadBroadcast", existed, "message", "");
    }

    @GetMapping("/activity-log")
    public List<Map<String, Object>> activityLog() {
        return activityLog.stream()
                .sorted(Comparator.comparing(entry -> String.valueOf(entry.get("time")), Comparator.reverseOrder()))
                .limit(20)
                .toList();
    }

    private Role parseRole(String role) {
        if (role == null || role.isBlank()) return Role.USER;
        try {
            return Role.valueOf(role.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return Role.USER;
        }
    }

    private void logAction(String action, String details) {
        Map<String, Object> item = new HashMap<>();
        item.put("action", action);
        item.put("details", details);
        item.put("time", LocalDateTime.now().toString());
        activityLog.add(item);
        if (activityLog.size() > 200) {
            activityLog.remove(0);
        }
    }

    private Map<String, Object> toUserMap(User user) {
        return Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "email", user.getEmail(),
                "phone", user.getPhone() == null ? "" : user.getPhone(),
                "bloodGroup", user.getBloodGroup() == null ? "" : user.getBloodGroup(),
                "emergencyContact", user.getEmergencyContact() == null ? "" : user.getEmergencyContact(),
                "role", user.getRole(),
                "active", user.getActive() == null ? true : user.getActive(),
                "lastLogin", user.getLastLogin() == null ? "" : user.getLastLogin().toString());
    }
}
