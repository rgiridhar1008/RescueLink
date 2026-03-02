package com.rescuelink.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.rescuelink.entity.BloodDonor;
import com.rescuelink.service.DonorService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/donors")
@RequiredArgsConstructor
public class DonorController {

    private final DonorService donorService;

    @GetMapping
    public List<BloodDonor> searchDonors(
            @RequestParam(required = false) String bloodGroup,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String availability) {
        return donorService.searchDonors(bloodGroup, city, availability);
    }

    @PostMapping("/{id}/request")
    public BloodDonor requestDonor(@PathVariable Long id, @RequestParam Long userId) {
        return donorService.requestDonor(id, userId);
    }

    @PostMapping("/{id}/cancel")
    public BloodDonor cancelDonorRequest(@PathVariable Long id, @RequestParam Long userId) {
        return donorService.cancelDonorRequest(id, userId);
    }
}
