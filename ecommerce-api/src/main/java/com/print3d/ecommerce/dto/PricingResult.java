package com.print3d.ecommerce.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PricingResult {
    private BigDecimal productionCost;
    private BigDecimal suggestedPrice; // Mantido para compatibilidade (Shoppe)
    private BigDecimal suggestedPriceShoppe;
    private BigDecimal suggestedPriceParticular;
    private BigDecimal netProfit; // Lucro Sem Custos Shoppe (Particular)
    private BigDecimal netProfitShoppe; // Lucro Com Custos Shoppe
    
    private BigDecimal energyCostTotal;
    private BigDecimal printerWearTotal;
    private BigDecimal packagingCost;
    private BigDecimal shopeeCostsTotal;
    private BigDecimal productionCostWithoutShoppe;
}
