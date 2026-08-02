package com.print3d.ecommerce.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FilamentDto {

    private UUID id;

    @NotBlank(message = "Material é obrigatório")
    private String material;

    @NotBlank(message = "Marca é obrigatória")
    private String brand;

    @NotBlank(message = "Cor é obrigatória")
    private String color;

    @NotNull(message = "Preço por quilo é obrigatório")
    @DecimalMin(value = "0.01", message = "O preço deve ser maior que zero")
    private BigDecimal pricePerKg;

    @NotNull(message = "Quantidade é obrigatória")
    @DecimalMin(value = "0.000", message = "A quantidade deve ser maior ou igual a zero")
    private BigDecimal quantityKg;

    private Boolean active;
    
    private String createdAt;
    private String updatedAt;
}
