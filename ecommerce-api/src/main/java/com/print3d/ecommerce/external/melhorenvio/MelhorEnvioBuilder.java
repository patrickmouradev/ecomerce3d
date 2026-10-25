package com.print3d.ecommerce.external.melhorenvio;

import java.math.BigDecimal;

public class MelhorEnvioBuilder {

    private String cepOrigem;
    private String cepDestino;
    private double pesoKg;
    private int comprimentoCm = 20; // Dimensões padrão de embalagem 3D (cm)
    private int alturaCm = 15;
    private int larguraCm = 20;
    private Integer servicoIdPreferencial;

    public MelhorEnvioBuilder deOrigem(String cepOrigem) {
        this.cepOrigem = cepOrigem != null ? cepOrigem.replaceAll("\\D", "") : null;
        return this;
    }

    public MelhorEnvioBuilder paraDestino(String cepDestino) {
        this.cepDestino = cepDestino != null ? cepDestino.replaceAll("\\D", "") : null;
        return this;
    }

    public MelhorEnvioBuilder comPesoGramas(BigDecimal pesoG) {
        if (pesoG != null) {
            this.pesoKg = pesoG.doubleValue() / 1000.0;
        }
        return this;
    }

    public MelhorEnvioBuilder comDimensoes(int comprimento, int altura, int largura) {
        this.comprimentoCm = comprimento;
        this.alturaCm = altura;
        this.larguraCm = largura;
        return this;
    }

    public MelhorEnvioBuilder comServicoIdPreferencial(Integer servicoId) {
        this.servicoIdPreferencial = servicoId;
        return this;
    }

    public MelhorEnvioRequestDto build() {
        if (cepOrigem == null || cepOrigem.isEmpty()) {
            throw new IllegalArgumentException("CEP de Origem é obrigatório");
        }
        if (cepDestino == null || cepDestino.isEmpty()) {
            throw new IllegalArgumentException("CEP de Destino é obrigatório");
        }
        return MelhorEnvioRequestDto.builder()
                .cepOrigem(cepOrigem)
                .cepDestino(cepDestino)
                .pesoKg(pesoKg > 0 ? pesoKg : 0.3)
                .comprimentoCm(comprimentoCm > 0 ? comprimentoCm : 20)
                .alturaCm(alturaCm > 0 ? alturaCm : 15)
                .larguraCm(larguraCm > 0 ? larguraCm : 20)
                .servicoIdPreferencial(servicoIdPreferencial)
                .build();
    }
}
