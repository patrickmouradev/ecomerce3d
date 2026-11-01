package com.print3d.ecommerce.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PushSubscribeRequestDto {

    @NotBlank(message = "O endpoint do Push Service é obrigatório")
    private String endpoint;

    @NotBlank(message = "A chave pública p256dh é obrigatória")
    private String p256dh;

    @NotBlank(message = "O segredo auth é obrigatório")
    private String auth;

    private String deviceType;
    private String userAgent;
}
