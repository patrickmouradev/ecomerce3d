package com.print3d.ecommerce.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PushCampaignResponseDto {
    private UUID id;
    private String title;
    private String body;
    private String targetUrl;
    private String targetRole;
    private String targetEmail;
    private int totalTargeted;
    private int totalSuccess;
    private int totalFailed;
    private String createdBy;
    private LocalDateTime createdAt;
}
