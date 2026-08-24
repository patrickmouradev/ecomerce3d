package com.print3d.ecommerce.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductPricingPreviewRequestDto {
    private BigDecimal printingHours;
    private BigDecimal profitMargin;
    private List<ProductFilamentDto> filaments;
}
