package com.print3d.ecommerce.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BannerDto {

    private UUID id;

    @NotBlank(message = "Título do banner é obrigatório")
    private String title;

    @NotBlank(message = "Caminho da imagem é obrigatório")
    private String imagePath;

    @NotNull(message = "Produto vinculado é obrigatório")
    private UUID productId;

    private String productName; // Apenas para exibição no frontend

    private Integer displayOrder;

    private Boolean active;
}
