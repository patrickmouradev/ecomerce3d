package com.print3d.ecommerce.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PushBroadcastRequestDto {

    @NotBlank(message = "O título da notificação é obrigatório")
    @Size(max = 120, message = "O título pode ter no máximo 120 caracteres")
    private String title;

    @NotBlank(message = "O texto da mensagem é obrigatório")
    @Size(max = 255, message = "O texto pode ter no máximo 255 caracteres")
    private String body;

    private String targetUrl;

    // Segmentos: 'TODOS', 'USUARIO', 'ADMINISTRADOR', 'FINANCEIRO', 'TESTE_DIRETO'
    private String targetRole;

    private String targetEmail;
}
