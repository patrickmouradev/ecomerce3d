package com.print3d.ecommerce.controller;

import com.print3d.ecommerce.service.CheckoutService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/webhooks/mercadopago")
@Tag(name = "Webhooks - Mercado Pago", description = "Endpoint público para receber notificações automáticas de pagamento (PIX/Cartão)")
public class MercadoPagoWebhookController {

    private static final Logger log = LoggerFactory.getLogger(MercadoPagoWebhookController.class);

    private final CheckoutService checkoutService;

    public MercadoPagoWebhookController(CheckoutService checkoutService) {
        this.checkoutService = checkoutService;
    }

    @PostMapping
    @Operation(summary = "Recebe notificações de eventos de pagamento do Mercado Pago")
    @SuppressWarnings("unchecked")
    public ResponseEntity<Map<String, String>> receiveWebhook(
            @RequestParam(value = "data.id", required = false) String queryDataId,
            @RequestParam(value = "id", required = false) String queryId,
            @RequestParam(value = "type", required = false) String queryType,
            @RequestParam(value = "topic", required = false) String queryTopic,
            @RequestBody(required = false) Map<String, Object> body) {

        try {
            String paymentId = queryDataId != null ? queryDataId : queryId;
            String type = queryType != null ? queryType : queryTopic;

            if (body != null) {
                if (type == null && body.get("type") != null) {
                    type = String.valueOf(body.get("type"));
                }
                if (paymentId == null && body.get("data") instanceof Map) {
                    Map<String, Object> dataMap = (Map<String, Object>) body.get("data");
                    if (dataMap.get("id") != null) {
                        paymentId = String.valueOf(dataMap.get("id"));
                    }
                }
            }

            log.info("Webhook Mercado Pago recebido: type={}, paymentId={}", type, paymentId);

            if (paymentId != null && (type == null || type.contains("payment"))) {
                checkoutService.processWebhookNotification(paymentId);
            }
        } catch (Exception e) {
            log.warn("Erro ao processar Webhook do Mercado Pago: {}", e.getMessage());
        }

        // O Mercado Pago exige retorno HTTP 200/201 rápido para confirmar o recebimento
        return ResponseEntity.ok(Map.of("status", "received"));
    }
}
