package com.rescuelink.service;

import java.util.List;

import com.rescuelink.dto.SOSRequest;
import com.rescuelink.entity.SOSAlert;

public interface SOSService {
    SOSAlert triggerAlert(SOSRequest request);
    List<SOSAlert> getAllAlerts();
    List<SOSAlert> getAlertsByUserId(Long userId);
    SOSAlert updateAlertStatus(Long id, String status);
}
