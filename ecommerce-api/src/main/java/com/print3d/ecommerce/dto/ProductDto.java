package com.print3d.ecommerce.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductDto {

    private UUID id;

    @NotBlank(message = "Nome do produto é obrigatório")
    private String name;

    private String description;

    private BigDecimal weightG; // Calculado dinamicamente pela soma dos pesos dos filamentos

    @NotNull(message = "Horas de impressão é obrigatório")
    @DecimalMin(value = "0.01", message = "As horas devem ser maiores que zero")
    private BigDecimal printingHours;

    @NotNull(message = "Lista de filamentos é obrigatória")
    private List<ProductFilamentDto> filaments;

    private BigDecimal suggestedPrice; // Calculado pelo sistema dinamicamente
    private BigDecimal suggestedPriceShoppe;
    private BigDecimal suggestedPriceParticular;

    private BigDecimal productionCost; // Calculado pelo sistema dinamicamente

    private BigDecimal netProfit; // Calculado pelo sistema dinamicamente
    private BigDecimal netProfitShoppe; // Calculado pelo sistema dinamicamente

    private BigDecimal energyCostTotal;
    private BigDecimal printerWearTotal;
    private BigDecimal packagingCost;
    private BigDecimal shopeeCostsTotal;
    private BigDecimal productionCostWithoutShoppe;

    @NotNull(message = "Margem de lucro é obrigatória")
    @DecimalMin(value = "0.00", message = "A margem de lucro deve ser no mínimo zero")
    private BigDecimal profitMargin;

    @NotNull(message = "Preço de venda particular é obrigatório")
    @DecimalMin(value = "0.01", message = "O preço de venda particular deve ser maior que zero")
    private BigDecimal salePriceParticular;

    @NotNull(message = "Preço de venda Shoppe é obrigatório")
    @DecimalMin(value = "0.01", message = "O preço de venda Shoppe deve ser maior que zero")
    private BigDecimal salePriceShoppe;

    private Boolean active;

    private List<String> imagesVideosPaths;

    private String createdAt;
    private String updatedAt;
}
