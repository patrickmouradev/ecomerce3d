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
    private BigDecimal suggestedPriceMercadoLivre; // Legado / Fallback Pix
    private BigDecimal suggestedPriceMercadoLivrePix;
    private BigDecimal suggestedPriceMercadoLivreCard;
    private BigDecimal netProfit; // Lucro Sem Custos Shoppe (Particular)
    private BigDecimal netProfitShoppe; // Lucro Com Custos Shoppe
    private BigDecimal netProfitMercadoLivre; // Legado / Fallback Pix
    private BigDecimal netProfitMercadoLivrePix;
    private BigDecimal netProfitMercadoLivreCard;
    
    private BigDecimal energyCostTotal;
    private BigDecimal printerWearTotal;
    private BigDecimal packagingCost;
    private BigDecimal accessoryCostTotal;
    private BigDecimal shopeeCostsTotal;
    private BigDecimal mercadoLivreCostsTotal;
    private BigDecimal mercadoLivrePixCostsTotal;
    private BigDecimal mercadoLivreCardCostsTotal;
    private BigDecimal productionCostWithoutShoppe;
}
