package com.rescuelink.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;

import com.rescuelink.entity.Hospital;
import com.rescuelink.exception.ResourceNotFoundException;
import com.rescuelink.repository.HospitalRepository;
import com.rescuelink.service.HospitalService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class HospitalServiceImpl implements HospitalService {

    private final HospitalRepository hospitalRepository;

    @Override
    public List<Hospital> getAllHospitals() {
        return hospitalRepository.findAll();
    }

    @Override
    public List<Hospital> searchByCity(String city) {
        return hospitalRepository.findByCityIgnoreCase(city);
    }

    @Override
    public Hospital addHospital(Hospital hospital) {
        if (hospital.getEmergencyAvailable() == null) {
            hospital.setEmergencyAvailable(true);
        }
        if (hospital.getEmergencyRating() == null) {
            hospital.setEmergencyRating(3.5);
        }
        return hospitalRepository.save(hospital);
    }

    @Override
    public Hospital updateHospital(Long id, Hospital hospital) {
        Hospital existing = hospitalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital not found: " + id));
        existing.setName(hospital.getName());
        existing.setCity(hospital.getCity());
        existing.setAddress(hospital.getAddress());
        existing.setLocation(hospital.getLocation());
        existing.setPhone(hospital.getPhone());
        existing.setLatitude(hospital.getLatitude());
        existing.setLongitude(hospital.getLongitude());
        existing.setEmergencyRating(hospital.getEmergencyRating());
        existing.setEmergencyAvailable(hospital.getEmergencyAvailable());
        return hospitalRepository.save(existing);
    }

    @Override
    public void deleteHospital(Long id) {
        if (!hospitalRepository.existsById(id)) {
            throw new ResourceNotFoundException("Hospital not found: " + id);
        }
        hospitalRepository.deleteById(id);
    }
}
