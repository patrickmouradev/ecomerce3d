package com.print3d.ecommerce.external.melhorenvio;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MelhorEnvioRequestDto {
    private String cepOrigem;
    private String cepDestino;
    private double pesoKg;
    private int comprimentoCm;
    private int alturaCm;
    private int larguraCm;
    private Integer servicoIdPreferencial;
}
