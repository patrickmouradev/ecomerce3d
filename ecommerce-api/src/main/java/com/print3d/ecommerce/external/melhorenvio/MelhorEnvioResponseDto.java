package com.print3d.ecommerce.external.melhorenvio;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MelhorEnvioResponseDto {
    private BigDecimal valorFrete;
    private int prazoEntregaDias;
    private Integer servicoId;
    private String servicoNome;
    private boolean simulado;
    private List<MelhorEnvioOptionDto> opcoes;
    private String erro;
}
