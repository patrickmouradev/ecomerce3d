package com.print3d.ecommerce.controller;

import com.print3d.ecommerce.model.Order;
import com.print3d.ecommerce.model.User;
import com.print3d.ecommerce.repository.OrderRepository;
import com.print3d.ecommerce.repository.UserRepository;
import com.print3d.ecommerce.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/orders")
@Tag(name = "Administração - Vendas e Relatórios", description = "Endpoints para gerenciamento de pedidos e emissão de relatórios consolidados em PDF")
@SecurityRequirement(name = "bearerAuth")
public class OrderController {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ReportService reportService;

    public OrderController(OrderRepository orderRepository, UserRepository userRepository, ReportService reportService) {
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.reportService = reportService;
    }

    @GetMapping
    @Operation(summary = "Lista todas as ordens de venda realizadas")
    public ResponseEntity<List<Order>> getAllOrders() {
        return ResponseEntity.ok(orderRepository.findAllOrdersWithUsers());
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
