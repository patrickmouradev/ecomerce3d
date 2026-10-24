package com.print3d.ecommerce.service;

import com.print3d.ecommerce.dto.PricingResult;
import com.print3d.ecommerce.model.BasicProductionCost;
import com.print3d.ecommerce.model.Product;
import com.print3d.ecommerce.model.ProductAccessory;
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
        Map<String, BasicProductionCost> costsEntitiesMap = basicProductionCostRepository.findByActiveTrue().stream()
                .collect(Collectors.toMap(
                        c -> c.getDescription() != null ? c.getDescription().trim() : "",
                        c -> c,
                        (v1, v2) -> v1
                ));

        BigDecimal energyCost = getFixedCostValue(costsEntitiesMap, CostConstants.CUSTO_ENERGIA);
        BigDecimal printWear = getFixedCostValue(costsEntitiesMap, CostConstants.CUSTO_DESGASTE_IMPRESAO);
        BigDecimal packagingCost = getFixedCostValue(costsEntitiesMap, CostConstants.CUSTO_EMBALAGEM);

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

        BigDecimal accessoryCostTotal = BigDecimal.ZERO;
        if (product.getAccessories() != null) {
            for (ProductAccessory pa : product.getAccessories()) {
                if (pa.getAccessory() != null && pa.getAccessory().getPrice() != null && pa.getQuantity() != null) {
                    BigDecimal qty = BigDecimal.valueOf(pa.getQuantity());
                    BigDecimal itemCost = pa.getAccessory().getPrice().multiply(qty);
                    accessoryCostTotal = accessoryCostTotal.add(itemCost);
                }
            }
        }
        accessoryCostTotal = accessoryCostTotal.setScale(2, RoundingMode.HALF_UP);

        BigDecimal printingHours = product.getPrintingHours() != null ? product.getPrintingHours() : BigDecimal.ZERO;
        BigDecimal profitMargin = product.getProfitMargin() != null ? product.getProfitMargin() : BigDecimal.ZERO;
        BigDecimal marginMultiplier = BigDecimal.ONE.add(profitMargin.divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP));
        BigDecimal marginRate = profitMargin.divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP);

        // print_cost = printing_hours * (energy_cost + print_wear)
        BigDecimal energyCostTotal = printingHours.multiply(energyCost).setScale(2, RoundingMode.HALF_UP);
        BigDecimal printerWearTotal = printingHours.multiply(printWear).setScale(2, RoundingMode.HALF_UP);
        BigDecimal printCost = energyCostTotal.add(printerWearTotal);

        // production_cost_without_shopee = filament_cost + print_cost + packagingCost + accessoryCostTotal
        BigDecimal productionCostWithoutShoppe = filamentCost
                .add(printCost)
                .add(packagingCost)
                .add(accessoryCostTotal)
                .setScale(2, RoundingMode.HALF_UP);

        // Valor base do produto (Custo de Produção + Margem)
        BigDecimal suggestedPriceParticular = productionCostWithoutShoppe
                .multiply(marginMultiplier)
                .setScale(2, RoundingMode.HALF_UP);

        // Custos Shopee (suporta valor em R$ ou % sobre Custo de Produção + Margem)
        BigDecimal shopeeFixedFee = resolveCostValue(findCostIgnoreCase(costsEntitiesMap, CostConstants.CUSTO_FIXO_SHOPPE), suggestedPriceParticular);
        BigDecimal shopeeCommission = resolveCostValue(findCostIgnoreCase(costsEntitiesMap, CostConstants.CUSTO_COMISSAO_SHOPPE), suggestedPriceParticular);
        BigDecimal shopeeCostsTotal = shopeeFixedFee.add(shopeeCommission).setScale(2, RoundingMode.HALF_UP);

        // production_cost = production_cost_without_shopee + shopeeCostsTotal
        BigDecimal productionCost = productionCostWithoutShoppe
                .add(shopeeCostsTotal)
                .setScale(2, RoundingMode.HALF_UP);

        // suggested_price_shopee = production_cost * (1 + (profit_margin / 100))
        BigDecimal suggestedPriceShoppe = productionCost
                .multiply(marginMultiplier)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal suggestedPrice = suggestedPriceShoppe;

        // net_profit = production_cost_without_shopee * (profit_margin / 100)
        BigDecimal netProfit = productionCostWithoutShoppe
                .multiply(marginRate)
                .setScale(2, RoundingMode.HALF_UP);

        // net_profit_shopee = production_cost * (profit_margin / 100)
        BigDecimal netProfitShoppe = productionCost
                .multiply(marginRate)
                .setScale(2, RoundingMode.HALF_UP);

        // Cálculo Mercado Livre (quando porcentagem, é calculado sobre Custo de Produção + Margem)
        BasicProductionCost mlCostEntity = findCostIgnoreCase(costsEntitiesMap, CostConstants.TAXA_MERCADO_LIVRE);
        BigDecimal mercadoLivreCostsTotal = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        BigDecimal suggestedPriceMercadoLivre = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        BigDecimal netProfitMercadoLivre = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

        if (mlCostEntity != null && mlCostEntity.getValue() != null && mlCostEntity.getValue() > 0) {
            mercadoLivreCostsTotal = resolveCostValue(mlCostEntity, suggestedPriceParticular).setScale(2, RoundingMode.HALF_UP);
            BigDecimal productionCostMercadoLivre = productionCostWithoutShoppe
                    .add(mercadoLivreCostsTotal)
                    .setScale(2, RoundingMode.HALF_UP);

            suggestedPriceMercadoLivre = productionCostMercadoLivre
                    .multiply(marginMultiplier)
                    .setScale(2, RoundingMode.HALF_UP);

            netProfitMercadoLivre = productionCostMercadoLivre
                    .multiply(marginRate)
                    .setScale(2, RoundingMode.HALF_UP);
        }

        return PricingResult.builder()
                .productionCost(productionCost)
                .suggestedPrice(suggestedPrice)
                .suggestedPriceShoppe(suggestedPriceShoppe)
                .suggestedPriceParticular(suggestedPriceParticular)
                .suggestedPriceMercadoLivre(suggestedPriceMercadoLivre)
                .netProfit(netProfit)
                .netProfitShoppe(netProfitShoppe)
                .netProfitMercadoLivre(netProfitMercadoLivre)
                .energyCostTotal(energyCostTotal)
                .printerWearTotal(printerWearTotal)
                .packagingCost(packagingCost.setScale(2, RoundingMode.HALF_UP))
                .accessoryCostTotal(accessoryCostTotal)
                .shopeeCostsTotal(shopeeCostsTotal)
                .mercadoLivreCostsTotal(mercadoLivreCostsTotal)
                .productionCostWithoutShoppe(productionCostWithoutShoppe)
                .build();
    }

    private BasicProductionCost findCostIgnoreCase(Map<String, BasicProductionCost> map, String key) {
        if (map.containsKey(key)) {
            return map.get(key);
        }
        for (Map.Entry<String, BasicProductionCost> entry : map.entrySet()) {
            if (entry.getKey().equalsIgnoreCase(key)) {
                return entry.getValue();
            }
        }
        return null;
    }

    private BigDecimal getFixedCostValue(Map<String, BasicProductionCost> map, String key) {
        BasicProductionCost cost = findCostIgnoreCase(map, key);
        if (cost == null || cost.getValue() == null) {
            return BigDecimal.ZERO;
        }
        return BigDecimal.valueOf(cost.getValue());
    }

    private BigDecimal resolveCostValue(BasicProductionCost cost, BigDecimal baseWithMargin) {
        if (cost == null || cost.getValue() == null) {
            return BigDecimal.ZERO;
        }
        BigDecimal val = BigDecimal.valueOf(cost.getValue());
        if (cost.isPercentage()) {
            return baseWithMargin.multiply(val.divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP));
        }
        return val;
    }
}
