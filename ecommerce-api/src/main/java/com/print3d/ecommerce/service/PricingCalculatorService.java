package com.print3d.ecommerce.service;

import com.print3d.ecommerce.dto.PricingResult;
import com.print3d.ecommerce.model.BasicProductionCost;
import com.print3d.ecommerce.model.Product;
import com.print3d.ecommerce.model.ProductFilament;
import com.print3d.ecommerce.repository.BasicProductionCostRepository;
import com.print3d.ecommerce.util.CostConstants;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PricingCalculatorService {

    private final BasicProductionCostRepository basicProductionCostRepository;

    public PricingCalculatorService(BasicProductionCostRepository basicProductionCostRepository) {
        this.basicProductionCostRepository = basicProductionCostRepository;
    }

    public PricingResult calculatePricing(Product product) {
        Map<String, BigDecimal> costsMap = basicProductionCostRepository.findByActiveTrue().stream()
                .collect(Collectors.toMap(
                        BasicProductionCost::getDescription,
                        c -> c.getValue() != null ? BigDecimal.valueOf(c.getValue()) : BigDecimal.ZERO,
                        (v1, v2) -> v1
                ));

        BigDecimal energyCost = costsMap.getOrDefault(CostConstants.CUSTO_ENERGIA, BigDecimal.ZERO);
        BigDecimal printWear = costsMap.getOrDefault(CostConstants.CUSTO_DESGASTE_IMPRESAO, BigDecimal.ZERO);
        BigDecimal shopeeFixedFee = costsMap.getOrDefault(CostConstants.CUSTO_FIXO_SHOPPE, BigDecimal.ZERO);
        BigDecimal shopeeCommission = costsMap.getOrDefault(CostConstants.CUSTO_COMISSAO_SHOPPE, BigDecimal.ZERO);
        BigDecimal packagingCost = costsMap.getOrDefault(CostConstants.CUSTO_EMBALAGEM, BigDecimal.ZERO);

        BigDecimal filamentCost = BigDecimal.ZERO;
        BigDecimal weight = BigDecimal.ZERO;

        if (product.getFilaments() != null) {
            for (ProductFilament pf : product.getFilaments()) {
                if (pf.getFilament() != null && pf.getFilament().getPricePerKg() != null) {
                    BigDecimal pricePerKg = pf.getFilament().getPricePerKg();
                    BigDecimal w = pf.getWeightG() != null ? pf.getWeightG() : BigDecimal.ZERO;

                    BigDecimal cost = pricePerKg
                            .divide(BigDecimal.valueOf(1000), 6, RoundingMode.HALF_UP)
                            .multiply(w);

                    filamentCost = filamentCost.add(cost);
                    weight = weight.add(w);
                }
            }
        }

        BigDecimal printingHours = product.getPrintingHours() != null ? product.getPrintingHours() : BigDecimal.ZERO;
        BigDecimal profitMargin = product.getProfitMargin() != null ? product.getProfitMargin() : BigDecimal.ZERO;

        // print_cost = printing_hours * (energy_cost + print_wear)
        BigDecimal energyCostTotal = printingHours.multiply(energyCost).setScale(2, RoundingMode.HALF_UP);
        BigDecimal printerWearTotal = printingHours.multiply(printWear).setScale(2, RoundingMode.HALF_UP);
        BigDecimal printCost = energyCostTotal.add(printerWearTotal);

        // shopee_costs = shopeeFixedFee + shopeeCommission
        BigDecimal shopeeCostsTotal = shopeeFixedFee.add(shopeeCommission).setScale(2, RoundingMode.HALF_UP);

        // production_cost_without_shopee = filament_cost + print_cost + packagingCost
        BigDecimal productionCostWithoutShoppe = filamentCost
                .add(printCost)
                .add(packagingCost)
                .setScale(2, RoundingMode.HALF_UP);

        // production_cost = production_cost_without_shopee + shopeeCostsTotal
        BigDecimal productionCost = productionCostWithoutShoppe
                .add(shopeeCostsTotal)
                .setScale(2, RoundingMode.HALF_UP);

        // suggested_price_shopee = production_cost * (1 + (profit_margin / 100))
        BigDecimal suggestedPriceShoppe = productionCost
                .multiply(BigDecimal.ONE.add(profitMargin.divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP)))
                .setScale(2, RoundingMode.HALF_UP);

        // suggested_price_particular = production_cost_without_shopee * (1 + (profit_margin / 100))
        BigDecimal suggestedPriceParticular = productionCostWithoutShoppe
                .multiply(BigDecimal.ONE.add(profitMargin.divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP)))
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal suggestedPrice = suggestedPriceShoppe;

        // net_profit = (production_cost_without_shopee + profit_margin_percent) - production_cost_without_shopee
        // which equals production_cost_without_shopee * (profit_margin / 100)
        BigDecimal netProfit = productionCostWithoutShoppe
                .multiply(profitMargin.divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP))
                .setScale(2, RoundingMode.HALF_UP);

        // net_profit_shopee = (production_cost + profit_margin_percent) - production_cost
        // which equals production_cost * (profit_margin / 100)
        BigDecimal netProfitShoppe = productionCost
                .multiply(profitMargin.divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP))
                .setScale(2, RoundingMode.HALF_UP);

        return PricingResult.builder()
                .productionCost(productionCost)
                .suggestedPrice(suggestedPrice)
                .suggestedPriceShoppe(suggestedPriceShoppe)
                .suggestedPriceParticular(suggestedPriceParticular)
                .netProfit(netProfit)
                .netProfitShoppe(netProfitShoppe)
                .energyCostTotal(energyCostTotal)
                .printerWearTotal(printerWearTotal)
                .packagingCost(packagingCost.setScale(2, RoundingMode.HALF_UP))
                .shopeeCostsTotal(shopeeCostsTotal)
                .productionCostWithoutShoppe(productionCostWithoutShoppe)
                .build();
    }
}
