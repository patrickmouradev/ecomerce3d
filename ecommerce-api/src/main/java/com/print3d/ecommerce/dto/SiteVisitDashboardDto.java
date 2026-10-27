package com.print3d.ecommerce.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SiteVisitDashboardDto {
    private long activeVisitorsLast5Min;
    private long uniqueVisitorsToday;
    private long totalEventsToday;
    private long uniqueVisitorsTotal;
    private long identifiedUsersTotal;
    private List<Map<String, Object>> topProductsViewed;
    private List<SiteVisitLogDto> recentLogs;
}
