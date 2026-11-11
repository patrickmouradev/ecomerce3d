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
public class FilamentBaixaDto {

    private UUID id;

    @NotNull(message = "Filamento é obrigatório")
    private UUID filamentId;

    private String filamentMaterial;
    private String filamentBrand;
    private String filamentColor;

    @NotNull(message = "Quantidade em gramas é obrigatória")
    @DecimalMin(value = "0.01", message = "A quantidade deve ser maior que zero")
    private BigDecimal quantityG;

    private String reason;

    private String createdAt;
    private String updatedAt;
}
