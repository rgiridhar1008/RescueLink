package com.rescuelink.service;

import com.rescuelink.entity.SOSAlert;

public interface NotificationService {
    void notifySOS(SOSAlert alert);
}

