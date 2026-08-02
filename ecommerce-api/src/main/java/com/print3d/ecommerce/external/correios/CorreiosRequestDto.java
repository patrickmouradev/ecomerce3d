package com.print3d.ecommerce.external.correios;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CorreiosRequestDto {
    private String cepOrigem;
    private String cepDestino;
    private double pesoKg;
    private int comprimentoCm;
    private int alturaCm;
    private int larguraCm;
}
