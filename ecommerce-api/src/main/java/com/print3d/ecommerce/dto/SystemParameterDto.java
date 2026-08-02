package com.print3d.ecommerce.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemParameterDto {

    private UUID id;

    @NotBlank(message = "Descrição é obrigatória")
    private String description;

    @NotBlank(message = "Valor do parâmetro é obrigatório")
    private String paramValue;

    private String formattedValue; // Ex: R$ 1.000,25 ou valor textual
    
    private String createdBy;
    private String updatedBy;
    
    private String createdAt; // Ex: dd/MM/yyyy
    private String updatedAt; // Ex: dd/MM/yyyy
    
    private Boolean active;
}
