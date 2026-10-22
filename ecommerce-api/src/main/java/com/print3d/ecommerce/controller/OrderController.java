package com.print3d.ecommerce.controller;

import com.print3d.ecommerce.dto.OrderResponseDto;
import com.print3d.ecommerce.model.Order;
import com.print3d.ecommerce.model.User;
import com.print3d.ecommerce.repository.OrderRepository;
import com.print3d.ecommerce.repository.UserRepository;
import com.print3d.ecommerce.service.CheckoutService;
import com.print3d.ecommerce.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/orders")
@Tag(name = "Administração - Vendas e Relatórios", description = "Endpoints para gerenciamento de pedidos e emissão de relatórios consolidados em PDF")
@SecurityRequirement(name = "bearerAuth")
public class OrderController {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ReportService reportService;
    private final CheckoutService checkoutService;

    public OrderController(OrderRepository orderRepository,
                           UserRepository userRepository,
                           ReportService reportService,
                           CheckoutService checkoutService) {
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.reportService = reportService;
        this.checkoutService = checkoutService;
    }

    @GetMapping
    @Operation(summary = "Lista todas as ordens de venda realizadas")
    public ResponseEntity<List<OrderResponseDto>> getAllOrders() {
        return ResponseEntity.ok(checkoutService.getAllOrdersAdmin());
    }

    @PatchMapping("/{orderId}")
    @Transactional
    @Operation(summary = "Atualiza status e/ou código de rastreio de um pedido")
    public ResponseEntity<OrderResponseDto> updateOrderStatus(
            @PathVariable UUID orderId,
            @RequestBody Map<String, String> payload) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Pedido não encontrado"));

        if (payload.containsKey("status") && payload.get("status") != null) {
            order.setStatus(payload.get("status").trim().toUpperCase());
        }
        if (payload.containsKey("trackingCode")) {
            order.setTrackingCode(payload.get("trackingCode"));
        }

        order = orderRepository.save(order);
        return ResponseEntity.ok(checkoutService.toOrderResponseDto(order));
    }

    @GetMapping("/report")
    @Operation(summary = "Exporta o relatório consolidado de vendas em formato PDF (JasperReports)")
    public ResponseEntity<byte[]> downloadSalesReport() {
        String loggedUserName = getCurrentAuditorName();
        byte[] pdfBytes = reportService.generateSalesReportPdf(loggedUserName);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "relatorio_vendas.pdf");
        headers.setContentLength(pdfBytes.length);

        return ResponseEntity.ok()
                .headers(headers)
                .body(pdfBytes);
    }

    private String getCurrentAuditorName() {
        try {
            var authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getPrincipal())) {
                String userIdStr = (String) authentication.getPrincipal();
                return userRepository.findById(UUID.fromString(userIdStr))
                        .map(User::getName)
                        .orElse("ADMINISTRADOR");
            }
        } catch (Exception e) {
            // Ignore
        }
        return "ADMINISTRADOR";
    }
}
