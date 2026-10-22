package com.print3d.ecommerce.external.mercadopago;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class MercadoPagoService {

    private static final Logger log = LoggerFactory.getLogger(MercadoPagoService.class);
    private static final String MP_PAYMENTS_URL = "https://api.mercadopago.com/v1/payments";

    @Value("${app.external.mercadopago.public-key:}")
    private String publicKey;

    @Value("${app.external.mercadopago.access-token:}")
    private String accessToken;

    @Value("${app.frontend.url:}")
    private String frontendUrl;

    private final RestTemplate restTemplate;

    public MercadoPagoService() {
        this.restTemplate = new RestTemplate();
    }

    public String getPublicKey() {
        return publicKey;
    }

    public boolean isConfiguredWithRealCredentials() {
        return accessToken != null
                && !accessToken.trim().isEmpty()
                && !accessToken.contains("XXXX")
                && publicKey != null
                && !publicKey.trim().isEmpty()
                && !publicKey.contains("XXXX");
    }

    /**
     * Processa um pagamento no Mercado Pago (PIX ou Cartão de Crédito) via API v1/payments.
     * Caso as credenciais ainda sejam placeholders (TEST-XXXX), executa em modo simulado.
     */
    @SuppressWarnings("unchecked")
    public MercadoPagoPaymentResponseDto criarPagamento(MercadoPagoPaymentRequestDto request) {
        log.info("Processando pagamento de R$ {} via {} para pedido {}",
                request.getTransactionAmount(), request.getPaymentMethodId(), request.getExternalReference());

        if (!isConfiguredWithRealCredentials()) {
            log.warn("Credenciais do Mercado Pago não configuradas (placeholder detectado). Utilizando modo Simulador.");
            return criarPagamentoSimulado(request);
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(accessToken.trim());
            headers.set("X-Idempotency-Key", UUID.randomUUID().toString());

            Map<String, Object> body = new HashMap<>();
            body.put("transaction_amount", request.getTransactionAmount());
            body.put("description", request.getDescription() != null ? request.getDescription() : "Compra 3DPrintPNG");
            body.put("payment_method_id", request.getPaymentMethodId());
            body.put("external_reference", request.getExternalReference());

            // Para cartão de crédito, envia token, parcelas e issuer_id
            if (!"pix".equalsIgnoreCase(request.getPaymentMethodId())) {
                body.put("token", request.getToken());
                body.put("installments", request.getInstallments() != null && request.getInstallments() > 0 ? request.getInstallments() : 1);
                if (request.getIssuerId() != null && !request.getIssuerId().trim().isEmpty()) {
                    body.put("issuer_id", request.getIssuerId());
                }
            } else {
                body.put("installments", 1);
            }

            // Configura notification_url apenas se for uma URL HTTPS pública válida (ex: DuckDNS com SSL)
            if (isValidPublicHttpsUrl(frontendUrl)) {
                String baseUrl = frontendUrl.endsWith("/") ? frontendUrl.substring(0, frontendUrl.length() - 1) : frontendUrl;
                body.put("notification_url", baseUrl + "/api/webhooks/mercadopago");
            }

            // Dados do Payer (Obrigatórios para PIX e Antifraude)
            Map<String, Object> payer = new HashMap<>();
            payer.put("email", request.getEmail());
            if (request.getFirstName() != null && !request.getFirstName().isEmpty()) {
                payer.put("first_name", request.getFirstName());
            }
            if (request.getLastName() != null && !request.getLastName().isEmpty()) {
                payer.put("last_name", request.getLastName());
            }
            if (request.getIdentificationNumber() != null && !request.getIdentificationNumber().isEmpty()) {
                Map<String, String> identification = new HashMap<>();
                identification.put("type", request.getIdentificationType() != null ? request.getIdentificationType() : "CPF");
                identification.put("number", request.getIdentificationNumber().replaceAll("\\D", ""));
                payer.put("identification", identification);
            }
            if (request.getZipCode() != null && !request.getZipCode().isEmpty()) {
                Map<String, Object> address = new HashMap<>();
                address.put("zip_code", request.getZipCode().replaceAll("\\D", ""));
                address.put("street_name", request.getStreetName());
                address.put("street_number", request.getStreetNumber());
                address.put("neighborhood", request.getNeighborhood());
                address.put("city", request.getCity());
                address.put("federal_unit", request.getFederalUnit());
                payer.put("address", address);
            }
            body.put("payer", payer);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.exchange(MP_PAYMENTS_URL, HttpMethod.POST, entity, Map.class);

            Map<String, Object> responseBody = response.getBody();
            if (responseBody == null) {
                throw new RuntimeException("Resposta vazia da API do Mercado Pago");
            }

            return mapFromMercadoPagoResponse(responseBody);

        } catch (HttpStatusCodeException e) {
            log.error("Erro HTTP do Mercado Pago ({}): {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("Mercado Pago recusou a requisição: " + e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error("Erro ao processar pagamento no Mercado Pago: {}", e.getMessage(), e);
            throw new RuntimeException("Falha ao comunicar com o Mercado Pago: " + e.getMessage());
        }
    }

    /**
     * Consulta o status atualizado de um pagamento diretamente na API do Mercado Pago.
     * Usado tanto pelo Webhook quanto pelo Polling ativo da tela de PIX.
     */
    @SuppressWarnings("unchecked")
    public MercadoPagoPaymentResponseDto consultarPagamento(String paymentId) {
        if (paymentId == null || paymentId.trim().isEmpty()) {
            throw new IllegalArgumentException("paymentId é obrigatório");
        }

        if (!isConfiguredWithRealCredentials() || paymentId.startsWith("SIM-")) {
            return MercadoPagoPaymentResponseDto.builder()
                    .paymentId(paymentId)
                    .status("pending")
                    .statusDetail("pending_waiting_transfer")
                    .simulated(true)
                    .build();
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken.trim());
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    MP_PAYMENTS_URL + "/" + paymentId.trim(),
                    HttpMethod.GET,
                    entity,
                    Map.class
            );

            Map<String, Object> responseBody = response.getBody();
            if (responseBody == null) {
                throw new RuntimeException("Resposta vazia ao consultar pagamento no Mercado Pago");
            }

            return mapFromMercadoPagoResponse(responseBody);
        } catch (Exception e) {
            log.error("Erro ao consultar pagamento {} no Mercado Pago: {}", paymentId, e.getMessage());
            throw new RuntimeException("Não foi possível consultar status do pagamento no Mercado Pago");
        }
    }

    @SuppressWarnings("unchecked")
    private MercadoPagoPaymentResponseDto mapFromMercadoPagoResponse(Map<String, Object> responseBody) {
        String id = String.valueOf(responseBody.get("id"));
        String status = (String) responseBody.get("status");
        String statusDetail = (String) responseBody.get("status_detail");

        String qrCode = null;
        String qrCodeBase64 = null;
        String ticketUrl = null;

        Map<String, Object> pointOfInteraction = (Map<String, Object>) responseBody.get("point_of_interaction");
        if (pointOfInteraction != null) {
            Map<String, Object> transactionData = (Map<String, Object>) pointOfInteraction.get("transaction_data");
            if (transactionData != null) {
                qrCode = (String) transactionData.get("qr_code");
                qrCodeBase64 = (String) transactionData.get("qr_code_base64");
                ticketUrl = (String) transactionData.get("ticket_url");
            }
        }

        return MercadoPagoPaymentResponseDto.builder()
                .paymentId(id)
                .status(status != null ? status : "pending")
                .statusDetail(statusDetail != null ? statusDetail : "")
                .qrCode(qrCode)
                .qrCodeBase64(qrCodeBase64)
                .ticketUrl(ticketUrl)
                .simulated(false)
                .build();
    }

    private boolean isValidPublicHttpsUrl(String url) {
        if (url == null || !url.toLowerCase().startsWith("https://")) {
            return false;
        }
        String lower = url.toLowerCase();
        return !lower.contains("localhost") && !lower.contains("127.0.0.1") && !lower.contains("192.168.");
    }

    private MercadoPagoPaymentResponseDto criarPagamentoSimulado(MercadoPagoPaymentRequestDto request) {
        String paymentId = "SIM-" + Math.abs(UUID.randomUUID().getMostSignificantBits());

        if ("pix".equalsIgnoreCase(request.getPaymentMethodId())) {
            return MercadoPagoPaymentResponseDto.builder()
                    .paymentId(paymentId)
                    .status("pending")
                    .statusDetail("pending_waiting_transfer")
                    .qrCode("00020126580014br.gov.bcb.pix0136" + UUID.randomUUID() + "5204000053039865405" + request.getTransactionAmount() + "5802BR59103DPRINTPNG6009SAOPAULO62070503***6304ABCD")
                    .qrCodeBase64(null)
                    .simulated(true)
                    .build();
        }

        // Cartão de crédito simulado: aprovado imediatamente
        return MercadoPagoPaymentResponseDto.builder()
                .paymentId(paymentId)
                .status("approved")
                .statusDetail("accredited")
                .simulated(true)
                .build();
    }
}
