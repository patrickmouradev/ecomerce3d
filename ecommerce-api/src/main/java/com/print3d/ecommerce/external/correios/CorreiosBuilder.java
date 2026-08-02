package com.print3d.ecommerce.external.correios;

import java.math.BigDecimal;

public class CorreiosBuilder {

    private String cepOrigem;
    private String cepDestino;
    private double pesoKg;
    private int comprimentoCm = 20; // Valores padrões padrão Correios
    private int alturaCm = 15;
    private int larguraCm = 20;

    public CorreiosBuilder deOrigem(String cepOrigem) {
        this.cepOrigem = cepOrigem != null ? cepOrigem.replaceAll("\\D", "") : null;
        return this;
    }

    public CorreiosBuilder paraDestino(String cepDestino) {
        this.cepDestino = cepDestino != null ? cepDestino.replaceAll("\\D", "") : null;
        return this;
    }

    public CorreiosBuilder comPesoGramas(BigDecimal pesoG) {
        if (pesoG != null) {
            // Converte gramas para Kg
            this.pesoKg = pesoG.doubleValue() / 1000.0;
        }
        return this;
    }

    public CorreiosBuilder comDimensoes(int comprimento, int altura, int largura) {
        this.comprimentoCm = comprimento;
        this.alturaCm = altura;
        this.larguraCm = largura;
        return this;
    }

    public CorreiosRequestDto build() {
        if (cepOrigem == null || cepOrigem.isEmpty()) {
            throw new IllegalArgumentException("CEP de Origem é obrigatório");
        }
        if (cepDestino == null || cepDestino.isEmpty()) {
            throw new IllegalArgumentException("CEP de Destino é obrigatório");
        }
        return CorreiosRequestDto.builder()
                .cepOrigem(cepOrigem)
                .cepDestino(cepDestino)
                .pesoKg(pesoKg > 0 ? pesoKg : 0.5) // Padrão 500g
                .comprimentoCm(comprimentoCm)
                .alturaCm(alturaCm)
                .larguraCm(larguraCm)
                .build();
    }
}
