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
public class BasicProductionCostDto {
    private UUID id;
    private String description;
    private Double value;
    private String formattedValue;
    private String createdBy;
    private String createdAt;
    private String updatedBy;
    private String updatedAt;
    private Boolean active;
}
