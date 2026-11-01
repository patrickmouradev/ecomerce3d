package com.print3d.ecommerce.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PushStatsDto {
    private long totalActiveSubscriptions;
    private long androidSubscriptions;
    private long iosSubscriptions;
    private long desktopSubscriptions;
    private long totalCampaignsSent;
}
