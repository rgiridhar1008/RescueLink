package com.rescuelink.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.rescuelink.entity.Hospital;

public interface HospitalRepository extends JpaRepository<Hospital, Long> {
    List<Hospital> findByCityIgnoreCase(String city);
    List<Hospital> findByNameContainingIgnoreCaseOrCityContainingIgnoreCase(String name, String city);
}
