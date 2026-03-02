package com.rescuelink.repository;

import java.util.List;
import java.time.LocalDateTime;

import org.springframework.data.jpa.repository.JpaRepository;

import com.rescuelink.entity.SOSAlert;

public interface SOSAlertRepository extends JpaRepository<SOSAlert, Long> {
    List<SOSAlert> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<SOSAlert> findByStatusOrderByCreatedAtDesc(String status);
    List<SOSAlert> findByLocationContainingIgnoreCaseOrderByCreatedAtDesc(String location);
    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
}
