package com.rescuelink.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.rescuelink.entity.BloodDonor;
import com.rescuelink.entity.DonorAvailability;

public interface BloodDonorRepository extends JpaRepository<BloodDonor, Long> {
    boolean existsByPhone(String phone);
    long countByVerifiedFalse();
    long countByVerifiedTrueAndAvailability(DonorAvailability availability);
    List<BloodDonor> findByBloodGroupIgnoreCaseAndVerifiedTrue(String bloodGroup);
    List<BloodDonor> findByBloodGroupIgnoreCaseAndVerifiedTrueAndAvailability(String bloodGroup, DonorAvailability availability);
    List<BloodDonor> findByVerifiedTrueAndAvailability(DonorAvailability availability);
    List<BloodDonor> findByVerifiedFalse();
}
