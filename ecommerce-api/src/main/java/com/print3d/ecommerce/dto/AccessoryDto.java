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
public class AccessoryDto {

    private UUID id;

    @NotBlank(message = "A descrição do acessório é obrigatória")
    private String description;

    @NotNull(message = "O preço do acessório é obrigatório")
    @DecimalMin(value = "0.01", message = "O preço do acessório deve ser maior que zero")
    private BigDecimal price;

    private Boolean active;

    private String createdAt;
    private String updatedAt;
}
