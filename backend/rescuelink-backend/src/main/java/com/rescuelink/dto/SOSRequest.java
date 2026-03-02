package com.rescuelink.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SOSRequest {
    private Long userId;

    @NotBlank
    private String message;

    @NotBlank
    private String location;
}
