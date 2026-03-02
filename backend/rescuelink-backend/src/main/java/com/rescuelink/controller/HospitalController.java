package com.rescuelink.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.rescuelink.entity.Hospital;
import com.rescuelink.service.HospitalService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/hospitals")
@RequiredArgsConstructor
public class HospitalController {

    private final HospitalService hospitalService;

    @GetMapping
    public List<Hospital> searchHospitals(@RequestParam(required = false) String city) {
        if (city == null || city.isBlank()) {
            return hospitalService.getAllHospitals();
        }
        return hospitalService.searchByCity(city);
    }
}
