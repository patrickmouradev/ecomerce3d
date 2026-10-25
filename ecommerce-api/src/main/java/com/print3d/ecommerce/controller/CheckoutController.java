package com.print3d.ecommerce.controller;

import com.print3d.ecommerce.dto.CheckoutProcessRequestDto;
import com.print3d.ecommerce.dto.CheckoutShippingRequestDto;
import com.print3d.ecommerce.dto.OrderMessageDto;
import com.print3d.ecommerce.dto.OrderResponseDto;
import com.print3d.ecommerce.external.melhorenvio.MelhorEnvioResponseDto;
import com.print3d.ecommerce.external.mercadopago.MercadoPagoService;
import com.print3d.ecommerce.service.CheckoutService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/checkout")
@Tag(name = "Checkout & Pagamentos (Mercado Pago)", description = "Endpoints para cálculo de frete, fechamento de pedido e integração com Payment Brick")
public class CheckoutController {

    private final CheckoutService checkoutService;
    private final MercadoPagoService mercadoPagoService;

    public CheckoutController(CheckoutService checkoutService, MercadoPagoService mercadoPagoService) {
        this.checkoutService = checkoutService;
        this.mercadoPagoService = mercadoPagoService;
    }

    @GetMapping("/config")
    @Operation(summary = "Retorna configurações de checkout e WhatsApp da loja")
    public ResponseEntity<Map<String, Object>> getCheckoutConfig() {
        return ResponseEntity.ok(Map.of(
                "publicKey", mercadoPagoService.getPublicKey() != null ? mercadoPagoService.getPublicKey() : "",
                "realCredentialsConfigured", mercadoPagoService.isConfiguredWithRealCredentials(),
                "whatsappNumber", checkoutService.resolveWhatsappLoja()
        ));
    }

    @PostMapping("/shipping")
    @Operation(summary = "Calcula o valor do frete e prazo de entrega pelo CEP e itens do carrinho via Melhor Envio")
    public ResponseEntity<MelhorEnvioResponseDto> calculateShipping(@RequestBody CheckoutShippingRequestDto request) {
        return ResponseEntity.ok(checkoutService.calculateShipping(request));
    }

    @PostMapping("/process")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Registra o pedido e processa o pagamento (PIX ou Cartão de Crédito) no Mercado Pago")
    public ResponseEntity<?> processCheckout(@RequestBody CheckoutProcessRequestDto request) {
        try {
            UUID userId = getAuthenticatedUserId();
            OrderResponseDto response = checkoutService.processCheckout(userId, request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/orders/{orderId}/status")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Consulta o status atualizado do pedido e sincroniza com o Mercado Pago (Polling PIX)")
    public ResponseEntity<OrderResponseDto> checkOrderStatus(@PathVariable UUID orderId) {
        UUID userId = getAuthenticatedUserId();
        return ResponseEntity.ok(checkoutService.checkAndSyncOrderStatus(userId, orderId));
    }

    @PostMapping("/orders/{orderId}/simulate-approve")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Simula a aprovação imediata de um pagamento PIX em ambiente de teste/simulação")
    public ResponseEntity<OrderResponseDto> simulateApproveOrder(@PathVariable UUID orderId) {
        UUID userId = getAuthenticatedUserId();
        return ResponseEntity.ok(checkoutService.simulateApproveOrder(userId, orderId));
    }

    @GetMapping("/my-orders")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Lista todos os pedidos realizados pelo cliente autenticado")
    public ResponseEntity<List<OrderResponseDto>> getMyOrders() {
        UUID userId = getAuthenticatedUserId();
        return ResponseEntity.ok(checkoutService.getMyOrders(userId));
    }

    @GetMapping("/orders/{orderId}/messages")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Lista as mensagens do chat entre comprador e vendedor de um pedido")
    public ResponseEntity<List<OrderMessageDto>> getOrderMessages(@PathVariable UUID orderId) {
        UUID userId = getAuthenticatedUserId();
        boolean isAdmin = hasAdminRole();
        return ResponseEntity.ok(checkoutService.getOrderMessages(userId, isAdmin, orderId));
    }

    @PostMapping("/orders/{orderId}/messages")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Envia uma mensagem no chat do pedido como comprador")
    public ResponseEntity<?> sendBuyerMessage(@PathVariable UUID orderId, @RequestBody Map<String, String> payload) {
        try {
            UUID userId = getAuthenticatedUserId();
            boolean isAdmin = hasAdminRole();
            String message = payload.get("message");
            OrderMessageDto saved = checkoutService.sendOrderMessage(userId, false, isAdmin, orderId, message);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    private boolean hasAdminRole() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getAuthorities() == null) return false;
        for (GrantedAuthority ga : auth.getAuthorities()) {
            String authority = ga.getAuthority();
            if ("ROLE_ADMINISTRADOR".equals(authority) || "ROLE_FINANCEIRO".equals(authority)) {
                return true;
            }
        }
        return false;
    }

    private UUID getAuthenticatedUserId() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new RuntimeException("Faça login para finalizar sua compra");
        }
        return UUID.fromString((String) auth.getPrincipal());
    }
}
