package com.rescuelink.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "blood_donors")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BloodDonor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String bloodGroup;
    private String city;
    private String phone;
    private boolean verified;
    private Long bookedByUserId;
    private LocalDateTime bookedAt;

    @Enumerated(EnumType.STRING)
    private DonorAvailability availability;
}
