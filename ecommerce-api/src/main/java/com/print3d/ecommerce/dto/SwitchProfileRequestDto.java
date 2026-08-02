package com.print3d.ecommerce.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SwitchProfileRequestDto {

    @NotBlank(message = "Perfil de destino é obrigatório")
    private String activeRole;
}
