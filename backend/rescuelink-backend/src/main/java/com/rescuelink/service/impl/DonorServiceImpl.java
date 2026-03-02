package com.rescuelink.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.rescuelink.entity.BloodDonor;
import com.rescuelink.entity.DonorAvailability;
import com.rescuelink.exception.BadRequestException;
import com.rescuelink.exception.ResourceNotFoundException;
import com.rescuelink.repository.BloodDonorRepository;
import com.rescuelink.service.DonorService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DonorServiceImpl implements DonorService {

    private final BloodDonorRepository donorRepository;

    @Override
    public List<BloodDonor> getAllDonors() {
        return donorRepository.findAll();
    }

    @Override
    public List<BloodDonor> searchByBloodGroup(String bloodGroup) {
        return donorRepository.findByBloodGroupIgnoreCaseAndVerifiedTrueAndAvailability(
                bloodGroup, DonorAvailability.AVAILABLE);
    }

    @Override
    public List<BloodDonor> searchDonors(String bloodGroup, String city, String availability) {
        DonorAvailability normalizedAvailability = parseAvailability(availability);
        List<BloodDonor> donors;

        if (bloodGroup != null && !bloodGroup.isBlank()) {
            if (normalizedAvailability != null) {
                donors = donorRepository.findByBloodGroupIgnoreCaseAndVerifiedTrueAndAvailability(
                        bloodGroup.trim(), normalizedAvailability);
            } else {
                donors = donorRepository.findByBloodGroupIgnoreCaseAndVerifiedTrue(bloodGroup.trim());
            }
        } else if (normalizedAvailability != null) {
            donors = donorRepository.findByVerifiedTrueAndAvailability(normalizedAvailability);
        } else {
            donors = donorRepository.findAll().stream()
                    .filter(BloodDonor::isVerified)
                    .collect(Collectors.toList());
        }

        if (city == null || city.isBlank()) {
            return donors;
        }
        String normalizedCity = city.trim().toLowerCase(Locale.ROOT);
        return donors.stream()
                .filter(donor -> donor.getCity() != null
                        && donor.getCity().toLowerCase(Locale.ROOT).contains(normalizedCity))
                .collect(Collectors.toList());
    }

    @Override
    public List<BloodDonor> getPendingDonors() {
        return donorRepository.findByVerifiedFalse();
    }

    @Override
    public BloodDonor addDonor(BloodDonor donor) {
        if (donor.getAvailability() == null) {
            donor.setAvailability(DonorAvailability.AVAILABLE);
        }
        return donorRepository.save(donor);
    }

    @Override
    public BloodDonor verifyDonor(Long id, boolean verified) {
        BloodDonor donor = donorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Donor not found: " + id));
        donor.setVerified(verified);
        if (donor.getAvailability() == null) {
            donor.setAvailability(DonorAvailability.AVAILABLE);
        }
        return donorRepository.save(donor);
    }

    @Override
    public BloodDonor requestDonor(Long donorId, Long requesterUserId) {
        if (requesterUserId == null) {
            throw new BadRequestException("User id is required to request donor");
        }
        BloodDonor donor = donorRepository.findById(donorId)
                .orElseThrow(() -> new ResourceNotFoundException("Donor not found: " + donorId));
        if (!donor.isVerified()) {
            throw new BadRequestException("Donor is not verified");
        }
        if (donor.getAvailability() == DonorAvailability.BUSY && donor.getBookedByUserId() != null
                && !requesterUserId.equals(donor.getBookedByUserId())) {
            throw new BadRequestException("Donor is already booked by another requester");
        }
        if (donor.getAvailability() == DonorAvailability.NOT_AVAILABLE) {
            throw new BadRequestException("Donor is currently not available");
        }

        donor.setAvailability(DonorAvailability.BUSY);
        donor.setBookedByUserId(requesterUserId);
        donor.setBookedAt(LocalDateTime.now());
        return donorRepository.save(donor);
    }

    @Override
    public BloodDonor cancelDonorRequest(Long donorId, Long requesterUserId) {
        if (requesterUserId == null) {
            throw new BadRequestException("User id is required to cancel donor request");
        }
        BloodDonor donor = donorRepository.findById(donorId)
                .orElseThrow(() -> new ResourceNotFoundException("Donor not found: " + donorId));
        if (donor.getBookedByUserId() == null || !requesterUserId.equals(donor.getBookedByUserId())) {
            throw new BadRequestException("Only the user who booked this donor can cancel the request");
        }

        donor.setBookedByUserId(null);
        donor.setBookedAt(null);
        donor.setAvailability(DonorAvailability.AVAILABLE);
        return donorRepository.save(donor);
    }

    private DonorAvailability parseAvailability(String availability) {
        if (availability == null || availability.isBlank()) {
            return null;
        }
        try {
            return DonorAvailability.valueOf(availability.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }
}
