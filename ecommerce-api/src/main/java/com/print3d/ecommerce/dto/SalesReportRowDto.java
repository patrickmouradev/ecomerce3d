package com.print3d.ecommerce.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalesReportRowDto {
    private String orderId;
    private String clientName;
    private String status;
    private Double totalAmount;
    private String createdAt;
}
