package com.rescuelink.service;

import java.util.List;

import com.rescuelink.entity.BloodDonor;

public interface DonorService {
    List<BloodDonor> getAllDonors();
    List<BloodDonor> searchByBloodGroup(String bloodGroup);
    List<BloodDonor> searchDonors(String bloodGroup, String city, String availability);
    List<BloodDonor> getPendingDonors();
    BloodDonor addDonor(BloodDonor donor);
    BloodDonor verifyDonor(Long id, boolean verified);
    BloodDonor requestDonor(Long donorId, Long requesterUserId);
    BloodDonor cancelDonorRequest(Long donorId, Long requesterUserId);
}
