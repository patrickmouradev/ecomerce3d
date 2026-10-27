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
public class SiteVisitTrackRequestDto {
    private String visitorId;
    private String eventType; // PAGE_VIEW, PRODUCT_VIEW, ADD_TO_CART
    private String pagePath;
    private UUID productId;
    private String productName;
    private String referrer;
}
