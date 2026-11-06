package com.print3d.ecommerce.external.mercadopago;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Service
public class MercadoPagoService {

    private static final Logger log = LoggerFactory.getLogger(MercadoPagoService.class);
    private static final String MP_ORDERS_URL = "https://api.mercadopago.com/v1/orders";
    private static final String MP_PAYMENTS_URL = "https://api.mercadopago.com/v1/payments";

    @Value("${app.external.mercadopago.public-key:}")
    private String publicKey;

    @Value("${app.external.mercadopago.access-token:}")
    private String accessToken;

    @Value("${app.frontend.url:}")
    private String frontendUrl;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public MercadoPagoService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
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
     * Processa um pagamento no Mercado Pago (PIX ou Cartão de Crédito) via Orders API (v1/orders).
     * Caso as credenciais ainda sejam placeholders (TEST-XXXX), executa em modo simulado.
     */
    @SuppressWarnings("unchecked")
    public MercadoPagoPaymentResponseDto criarPagamento(MercadoPagoPaymentRequestDto request) {
        log.info("Processando pagamento via Orders API de R$ {} via {} para pedido {}",
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

            BigDecimal amount = request.getTransactionAmount() != null
                    ? request.getTransactionAmount().setScale(2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            String amountStr = amount.toPlainString();

            Map<String, Object> body = new HashMap<>();
            body.put("type", "online");
            body.put("processing_mode", "automatic");
            body.put("total_amount", amountStr);
            body.put("external_reference", request.getExternalReference());
            String description = (request.getDescription() != null && !request.getDescription().isBlank())
                    ? request.getDescription().trim()
                    : "Compra 3DPrintPNG";
            if (description.length() > 150) {
                description = description.substring(0, 147) + "...";
            }
            body.put("description", description);

            // Dados do Payer
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
                address.put("state", request.getFederalUnit());
                payer.put("address", address);
            }
            body.put("payer", payer);

            // Transação de Pagamento (PIX ou Cartão)
            Map<String, Object> paymentMethod = new HashMap<>();
            boolean isPix = request.getPaymentMethodId() == null || "pix".equalsIgnoreCase(request.getPaymentMethodId());

            if (isPix) {
                paymentMethod.put("id", "pix");
                paymentMethod.put("type", "bank_transfer");
            } else {
                paymentMethod.put("id", request.getPaymentMethodId());
                paymentMethod.put("type", "credit_card");
                paymentMethod.put("token", request.getToken());
                paymentMethod.put("installments", request.getInstallments() != null && request.getInstallments() > 0 ? request.getInstallments() : 1);
            }

            Map<String, Object> paymentTx = new HashMap<>();
            paymentTx.put("amount", amountStr);
            paymentTx.put("payment_method", paymentMethod);

            Map<String, Object> transactions = new HashMap<>();
            transactions.put("payments", List.of(paymentTx));
            body.put("transactions", transactions);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.exchange(MP_ORDERS_URL, HttpMethod.POST, entity, Map.class);

            Map<String, Object> responseBody = response.getBody();
            if (responseBody == null) {
                throw new RuntimeException("Resposta vazia da Orders API do Mercado Pago");
            }

            return mapFromMercadoPagoResponse(responseBody);

        } catch (HttpStatusCodeException e) {
            log.warn("Mercado Pago retornou status HTTP {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            try {
                // Se a Orders API retornou HTTP 4xx com o objeto "data" da ordem recusada (ex: high_risk, card_disabled)
                Map<String, Object> errBody = objectMapper.readValue(e.getResponseBodyAsString(), Map.class);
                if (errBody != null && errBody.get("data") instanceof Map) {
                    Map<String, Object> data = (Map<String, Object>) errBody.get("data");
                    return mapFromMercadoPagoResponse(data);
                }
            } catch (Exception ex) {
                log.debug("Não foi possível extrair dados da ordem no corpo do erro HTTP: {}", ex.getMessage());
            }
            throw new RuntimeException("Mercado Pago recusou a requisição: " + e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error("Erro ao processar pagamento no Mercado Pago: {}", e.getMessage(), e);
            throw new RuntimeException("Falha ao comunicar com o Mercado Pago: " + e.getMessage());
        }
    }

    /**
     * Consulta o status atualizado de uma order ou pagamento diretamente na API do Mercado Pago.
     * Usado tanto pelo Webhook quanto pelo Polling ativo da tela de PIX.
     */
    @SuppressWarnings("unchecked")
    public MercadoPagoPaymentResponseDto consultarPagamento(String orderOrPaymentId) {
        if (orderOrPaymentId == null || orderOrPaymentId.trim().isEmpty()) {
            throw new IllegalArgumentException("paymentId/orderId é obrigatório");
        }

        if (!isConfiguredWithRealCredentials() || orderOrPaymentId.startsWith("SIM-")) {
            return MercadoPagoPaymentResponseDto.builder()
                    .paymentId(orderOrPaymentId)
                    .status("pending")
                    .statusDetail("pending_waiting_transfer")
                    .simulated(true)
                    .build();
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken.trim());
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            String url = (orderOrPaymentId.startsWith("ORD") || orderOrPaymentId.length() > 20)
                    ? MP_ORDERS_URL + "/" + orderOrPaymentId.trim()
                    : MP_PAYMENTS_URL + "/" + orderOrPaymentId.trim();

            ResponseEntity<Map> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    Map.class
            );

            Map<String, Object> responseBody = response.getBody();
            if (responseBody == null) {
                throw new RuntimeException("Resposta vazia ao consultar order no Mercado Pago");
            }

            return mapFromMercadoPagoResponse(responseBody);
        } catch (Exception e) {
            log.error("Erro ao consultar order/pagamento {} no Mercado Pago: {}", orderOrPaymentId, e.getMessage());
            throw new RuntimeException("Não foi possível consultar status no Mercado Pago: " + e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private MercadoPagoPaymentResponseDto mapFromMercadoPagoResponse(Map<String, Object> responseBody) {
        String orderId = String.valueOf(responseBody.get("id"));
        String orderStatus = (String) responseBody.get("status");
        String orderStatusDetail = (String) responseBody.get("status_detail");

        String qrCode = null;
        String qrCodeBase64 = null;
        String ticketUrl = null;
        String paymentId = orderId;
        String paymentStatus = orderStatus;
        String paymentStatusDetail = orderStatusDetail;

        // Extrai dados da primeira transação/pagamento dentro de transactions.payments (Orders API)
        Map<String, Object> transactions = (Map<String, Object>) responseBody.get("transactions");
        if (transactions != null) {
            List<Map<String, Object>> payments = (List<Map<String, Object>>) transactions.get("payments");
            if (payments != null && !payments.isEmpty()) {
                Map<String, Object> firstPayment = payments.get(0);
                if (firstPayment.get("id") != null) {
                    paymentId = String.valueOf(firstPayment.get("id"));
                }
                if (firstPayment.get("status") != null) {
                    paymentStatus = String.valueOf(firstPayment.get("status"));
                }
                if (firstPayment.get("status_detail") != null) {
                    paymentStatusDetail = String.valueOf(firstPayment.get("status_detail"));
                }

                Map<String, Object> paymentMethod = (Map<String, Object>) firstPayment.get("payment_method");
                if (paymentMethod != null) {
                    qrCode = (String) paymentMethod.get("qr_code");
                    qrCodeBase64 = (String) paymentMethod.get("qr_code_base64");
                    ticketUrl = (String) paymentMethod.get("ticket_url");
                }
            }
        }

        // Suporte legado (caso receba payload de v1/payments)
        Map<String, Object> pointOfInteraction = (Map<String, Object>) responseBody.get("point_of_interaction");
        if (pointOfInteraction != null) {
            Map<String, Object> transactionData = (Map<String, Object>) pointOfInteraction.get("transaction_data");
            if (transactionData != null) {
                if (qrCode == null) qrCode = (String) transactionData.get("qr_code");
                if (qrCodeBase64 == null) qrCodeBase64 = (String) transactionData.get("qr_code_base64");
                if (ticketUrl == null) ticketUrl = (String) transactionData.get("ticket_url");
            }
        }

        // Normaliza status para o padrão esperado pelo CheckoutService (approved, pending, rejected, cancelled)
        String normalizedStatus = normalizeStatus(orderStatus, paymentStatus);

        return MercadoPagoPaymentResponseDto.builder()
                .paymentId(orderId != null && !orderId.equals("null") ? orderId : paymentId)
                .status(normalizedStatus)
                .statusDetail(paymentStatusDetail != null ? paymentStatusDetail : (orderStatusDetail != null ? orderStatusDetail : ""))
                .qrCode(qrCode)
                .qrCodeBase64(qrCodeBase64)
                .ticketUrl(ticketUrl)
                .simulated(false)
                .build();
    }

    private String normalizeStatus(String orderStatus, String paymentStatus) {
        if ("processed".equalsIgnoreCase(orderStatus) || "approved".equalsIgnoreCase(orderStatus)
                || "processed".equalsIgnoreCase(paymentStatus) || "approved".equalsIgnoreCase(paymentStatus)) {
            return "approved";
        }
        if ("failed".equalsIgnoreCase(orderStatus) || "rejected".equalsIgnoreCase(orderStatus)
                || "failed".equalsIgnoreCase(paymentStatus) || "rejected".equalsIgnoreCase(paymentStatus)) {
            return "rejected";
        }
        if ("canceled".equalsIgnoreCase(orderStatus) || "cancelled".equalsIgnoreCase(orderStatus)
                || "canceled".equalsIgnoreCase(paymentStatus) || "cancelled".equalsIgnoreCase(paymentStatus)) {
            return "cancelled";
        }
        if ("refunded".equalsIgnoreCase(orderStatus) || "refunded".equalsIgnoreCase(paymentStatus)) {
            return "refunded";
        }
        return "pending";
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
