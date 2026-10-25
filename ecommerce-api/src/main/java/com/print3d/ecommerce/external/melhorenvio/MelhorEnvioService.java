package com.print3d.ecommerce.external.melhorenvio;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Service
public class MelhorEnvioService {

    private static final Logger log = LoggerFactory.getLogger(MelhorEnvioService.class);
    private static final String CALCULATE_PATH = "/api/v2/me/shipment/calculate";

    @Value("${app.external.melhorenvio.url:https://sandbox.melhorenvio.com.br}")
    private String melhorEnvioUrl;

    @Value("${app.external.melhorenvio.token:}")
    private String melhorEnvioToken;

    @Value("${app.external.melhorenvio.user-agent:3DPrintPNG (3dprintpng@gmail.com)}")
    private String userAgent;

    private final RestTemplate restTemplate;

    public MelhorEnvioService() {
        this.restTemplate = new RestTemplate();
    }

    public boolean isConfiguredWithRealCredentials() {
        return melhorEnvioToken != null
                && !melhorEnvioToken.trim().isEmpty()
                && !melhorEnvioToken.contains("XXXX");
    }

    /**
     * Calcula o valor do frete e prazo de entrega consultando a API v2 do Melhor Envio
     * (/api/v2/me/shipment/calculate).
     * Caso o token ainda esteja em modo placeholder (TEST-XXXX) ou ocorra falha de rede,
     * utiliza o simulador multi-transportadora do Melhor Envio como fallback seguro.
     */
    @SuppressWarnings("unchecked")
    public MelhorEnvioResponseDto calcularFrete(MelhorEnvioRequestDto request) {
        log.info("Calculando frete via Melhor Envio de {} para {} (Peso: {} kg)",
                request.getCepOrigem(), request.getCepDestino(), request.getPesoKg());

        if (!isConfiguredWithRealCredentials()) {
            log.info("Token do Melhor Envio não configurado (placeholder detectado). Utilizando cotação simulada.");
            return calcularFreteSimulado(request);
        }

        try {
            String baseUrl = melhorEnvioUrl.endsWith("/")
                    ? melhorEnvioUrl.substring(0, melhorEnvioUrl.length() - 1)
                    : melhorEnvioUrl;
            String endpoint = baseUrl + CALCULATE_PATH;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setAccept(List.of(MediaType.APPLICATION_JSON));
            headers.setBearerAuth(melhorEnvioToken.trim());
            headers.set("User-Agent", userAgent != null && !userAgent.isBlank()
                    ? userAgent.trim()
                    : "3DPrintPNG (3dprintpng@gmail.com)");

            Map<String, Object> body = new HashMap<>();
            body.put("from", Map.of("postal_code", request.getCepOrigem().replaceAll("\\D", "")));
            body.put("to", Map.of("postal_code", request.getCepDestino().replaceAll("\\D", "")));
            body.put("package", Map.of(
                    "height", request.getAlturaCm() > 0 ? request.getAlturaCm() : 15,
                    "width", request.getLarguraCm() > 0 ? request.getLarguraCm() : 20,
                    "length", request.getComprimentoCm() > 0 ? request.getComprimentoCm() : 20,
                    "weight", Math.max(0.3, request.getPesoKg())
            ));
            body.put("options", Map.of(
                    "receipt", false,
                    "own_hand", false
            ));

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                    endpoint,
                    HttpMethod.POST,
                    entity,
                    new ParameterizedTypeReference<>() {}
            );

            List<Map<String, Object>> rawList = response.getBody();
            if (rawList == null || rawList.isEmpty()) {
                log.warn("Resposta vazia da API do Melhor Envio, ativando fallback simulado.");
                return calcularFreteSimulado(request);
            }

            List<MelhorEnvioOptionDto> validOptions = new ArrayList<>();
            for (Map<String, Object> item : rawList) {
                if (item.get("error") != null) {
                    continue; // Ignora modalidades indisponíveis para o trecho/dimensões
                }

                Object priceObj = item.get("custom_price") != null ? item.get("custom_price") : item.get("price");
                Object deliveryObj = item.get("custom_delivery_time") != null ? item.get("custom_delivery_time") : item.get("delivery_time");
                if (priceObj == null || deliveryObj == null) {
                    continue;
                }

                Integer id = item.get("id") instanceof Number ? ((Number) item.get("id")).intValue() : null;
                String serviceName = item.get("name") != null ? String.valueOf(item.get("name")) : "Padrão";

                String companyName = "Transportadora";
                String companyLogo = null;
                if (item.get("company") instanceof Map) {
                    Map<String, Object> companyMap = (Map<String, Object>) item.get("company");
                    if (companyMap.get("name") != null) {
                        companyName = String.valueOf(companyMap.get("name"));
                    }
                    if (companyMap.get("picture") != null) {
                        companyLogo = String.valueOf(companyMap.get("picture"));
                    }
                }

                // Filtra para retornar somente opções dos Correios (PAC, SEDEX, Mini Envios, etc.)
                if (!companyName.toLowerCase(Locale.ROOT).contains("correios")) {
                    continue;
                }

                BigDecimal valor = new BigDecimal(String.valueOf(priceObj)).setScale(2, RoundingMode.HALF_UP);
                int prazo = Integer.parseInt(String.valueOf(deliveryObj));

                validOptions.add(MelhorEnvioOptionDto.builder()
                        .id(id)
                        .nome(serviceName)
                        .transportadora(companyName)
                        .logoUrl(companyLogo)
                        .valor(valor)
                        .prazoDias(prazo)
                        .build());
            }

            if (validOptions.isEmpty()) {
                log.warn("Nenhuma modalidade disponível retornada pelo Melhor Envio para o CEP {}, ativando fallback.", request.getCepDestino());
                return calcularFreteSimulado(request);
            }

            // Ordena as opções dos Correios da mais barata para a mais cara
            validOptions.sort(Comparator.comparing(MelhorEnvioOptionDto::getValor));

            // Adiciona a opção de Retirar com Comprador (R$ 0,00)
            validOptions.add(MelhorEnvioOptionDto.builder()
                    .id(0)
                    .transportadora("Retirada")
                    .nome("Retirar com Comprador")
                    .valor(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP))
                    .prazoDias(1)
                    .build());

            MelhorEnvioOptionDto chosen = selectOption(validOptions, request.getServicoIdPreferencial());

            String servicoNome = chosen.getId() != null && chosen.getId() == 0
                    ? chosen.getNome()
                    : chosen.getTransportadora() + " (" + chosen.getNome() + ")";

            return MelhorEnvioResponseDto.builder()
                    .valorFrete(chosen.getValor())
                    .prazoEntregaDias(chosen.getPrazoDias())
                    .servicoId(chosen.getId())
                    .servicoNome(servicoNome)
                    .simulado(false)
                    .opcoes(validOptions)
                    .build();

        } catch (Exception e) {
            log.warn("Erro ao consultar API do Melhor Envio ({}), ativando fallback simulado.", e.getMessage());
            return calcularFreteSimulado(request);
        }
    }

    private MelhorEnvioOptionDto selectOption(List<MelhorEnvioOptionDto> opcoes, Integer servicoIdPreferencial) {
        if (servicoIdPreferencial != null) {
            for (MelhorEnvioOptionDto op : opcoes) {
                if (servicoIdPreferencial.equals(op.getId())) {
                    return op;
                }
            }
        }
        return opcoes.get(0);
    }

    private MelhorEnvioResponseDto calcularFreteSimulado(MelhorEnvioRequestDto request) {
        int prefixoOrigem = Integer.parseInt(request.getCepOrigem().substring(0, 2));
        int prefixoDestino = Integer.parseInt(request.getCepDestino().substring(0, 2));

        BigDecimal valorBasePac = new BigDecimal("14.90");
        int diasPac = 5;

        if (Math.abs(prefixoOrigem - prefixoDestino) > 10) {
            valorBasePac = new BigDecimal("28.90");
            diasPac = 8;
        } else if (Math.abs(prefixoOrigem - prefixoDestino) > 0) {
            valorBasePac = new BigDecimal("19.50");
            diasPac = 6;
        }

        BigDecimal pesoAdicional = BigDecimal.valueOf(request.getPesoKg()).multiply(new BigDecimal("4.00"));
        BigDecimal valorPac = valorBasePac.add(pesoAdicional).setScale(2, RoundingMode.HALF_UP);
        BigDecimal valorSedex = valorPac.multiply(new BigDecimal("1.45")).setScale(2, RoundingMode.HALF_UP);

        List<MelhorEnvioOptionDto> opcoes = List.of(
                MelhorEnvioOptionDto.builder()
                        .id(1)
                        .transportadora("Correios")
                        .nome("PAC")
                        .valor(valorPac)
                        .prazoDias(diasPac)
                        .build(),
                MelhorEnvioOptionDto.builder()
                        .id(2)
                        .transportadora("Correios")
                        .nome("SEDEX")
                        .valor(valorSedex)
                        .prazoDias(Math.max(1, diasPac - 3))
                        .build(),
                MelhorEnvioOptionDto.builder()
                        .id(0)
                        .transportadora("Retirada")
                        .nome("Retirar com Comprador")
                        .valor(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP))
                        .prazoDias(1)
                        .build()
        );

        MelhorEnvioOptionDto chosen = selectOption(opcoes, request.getServicoIdPreferencial());

        String servicoNome = chosen.getId() != null && chosen.getId() == 0
                ? chosen.getNome()
                : chosen.getTransportadora() + " - " + chosen.getNome();

        return MelhorEnvioResponseDto.builder()
                .valorFrete(chosen.getValor())
                .prazoEntregaDias(chosen.getPrazoDias())
                .servicoId(chosen.getId())
                .servicoNome(servicoNome)
                .simulado(true)
                .opcoes(opcoes)
                .build();
    }
}
