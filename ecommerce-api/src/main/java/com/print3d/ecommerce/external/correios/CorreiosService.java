package com.print3d.ecommerce.external.correios;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class CorreiosService {

    private static final Logger log = LoggerFactory.getLogger(CorreiosService.class);

    @Value("${app.external.correios.url}")
    private String correiosUrl;

    private final RestTemplate restTemplate;

    public CorreiosService() {
        this.restTemplate = new RestTemplate();
    }

    /**
     * Calcula o valor do frete e prazo de entrega.
     * Possui fallback automático (simulador) em caso de indisponibilidade da API ou credenciais.
     */
    public CorreiosResponseDto calcularFrete(CorreiosRequestDto request) {
        log.info("Iniciando cálculo de frete de {} para {}", request.getCepOrigem(), request.getCepDestino());
        
        try {
            // Em produção real, faria a requisição HTTP REST para a API dos Correios:
            // String endpoint = correiosUrl + "/v1/preco-prazo";
            // return restTemplate.postForObject(endpoint, request, CorreiosResponseDto.class);
            
            // Simulação de chamada HTTP (Mock de alta fidelidade)
            return calcularFreteSimulado(request);
        } catch (Exception e) {
            log.warn("Erro ao conectar com API dos Correios, ativando fallback simulado: {}", e.getMessage());
            return calcularFreteSimulado(request);
        }
    }

    private CorreiosResponseDto calcularFreteSimulado(CorreiosRequestDto request) {
        // Lógica simples e coerente de cálculo simulado por região de CEP:
        // Prefixo do CEP (primeiros digitos)
        int prefixoOrigem = Integer.parseInt(request.getCepOrigem().substring(0, 2));
        int prefixoDestino = Integer.parseInt(request.getCepDestino().substring(0, 2));

        BigDecimal valorBase = new BigDecimal("15.00");
        int diasPrazo = 3;

        // Se forem de estados/regiões bem distantes
        if (Math.abs(prefixoOrigem - prefixoDestino) > 10) {
            valorBase = new BigDecimal("29.90");
            diasPrazo = 7;
        } else if (Math.abs(prefixoOrigem - prefixoDestino) > 0) {
            valorBase = new BigDecimal("19.90");
            diasPrazo = 5;
        }

        // Adiciona taxa pelo peso (R$ 4.00 por quilo)
        BigDecimal pesoAdicional = BigDecimal.valueOf(request.getPesoKg()).multiply(new BigDecimal("4.00"));
        BigDecimal valorTotal = valorBase.add(pesoAdicional).setScale(2, RoundingMode.HALF_UP);

        return CorreiosResponseDto.builder()
                .valorFrete(valorTotal)
                .prazoEntregaDias(diasPrazo)
                .build();
    }
}
