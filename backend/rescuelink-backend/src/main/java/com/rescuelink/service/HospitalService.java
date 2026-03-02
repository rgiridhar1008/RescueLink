package com.rescuelink.service;

import java.util.List;

import com.rescuelink.entity.Hospital;

public interface HospitalService {
    List<Hospital> getAllHospitals();
    List<Hospital> searchByCity(String city);
    Hospital addHospital(Hospital hospital);
    Hospital updateHospital(Long id, Hospital hospital);
    void deleteHospital(Long id);
}
