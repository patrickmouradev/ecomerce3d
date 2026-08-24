package com.print3d.ecommerce.dto;

import jakarta.validation.constraints.DecimalMin;
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
public class ProductFilamentDto {

    @NotNull(message = "O ID do filamento é obrigatório")
    private UUID filamentId;

    private String filamentLabel; // Ex: PLA - 3D Lab (Vermelho)

    @NotNull(message = "O peso é obrigatório")
    @DecimalMin(value = "0.001", message = "O peso consumido deve ser maior que zero")
    private BigDecimal weightG;

    private BigDecimal pricePerKg; // Auxiliar para a calculadora no front
}
