package com.print3d.ecommerce.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SiteVisitLogDto {
    private UUID id;
    private String visitorId;
    private UUID userId;
    private String userName;
    private String userEmail;
    private String ipAddress;
    private String city;
    private String region;
    private String country;
    private String isp;
    private String deviceType;
    private String os;
    private String browser;
    private String eventType;
    private String pagePath;
    private UUID productId;
    private String productName;
    private String referrer;
    private String createdAt;
}
