package com.print3d.ecommerce.controller;

import com.print3d.ecommerce.dto.ProductReviewDto;
import com.print3d.ecommerce.dto.ProductReviewsPageDto;
import com.print3d.ecommerce.service.ProductReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@Tag(name = "Avaliações de Produtos", description = "Endpoints para envio e consulta de avaliações de produtos por compradores")
public class ProductReviewController {

    private final ProductReviewService reviewService;

    public ProductReviewController(ProductReviewService reviewService) {
        this.reviewService = reviewService;
    }

    /* =========================================================================
       ROTAS PÚBLICAS
       ========================================================================= */

    @GetMapping("/api/products/{productId}/reviews")
    @Operation(summary = "Retorna avaliações aprovadas e estatísticas do produto (se visibilidade ativa)")
    public ResponseEntity<ProductReviewsPageDto> getProductReviews(@PathVariable UUID productId) {
        return ResponseEntity.ok(reviewService.getProductReviewsPublic(productId));
    }

    @GetMapping("/api/products/reviews/config")
    @Operation(summary = "Retorna o status global de exibição de avaliações e mínimo por produto")
    public ResponseEntity<Map<String, Object>> getReviewConfig() {
        return ResponseEntity.ok(Map.of(
                "enabled", reviewService.isReviewsEnabled(),
                "minReviewsRequired", reviewService.getMinReviewsRequired()
        ));
    }

    /* =========================================================================
       ROTAS DO CLIENTE AUTENTICADO
       ========================================================================= */

    @PostMapping(value = "/api/products/{productId}/reviews", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Envia uma avaliação de produto para um pedido entregue com até 3 fotos")
    public ResponseEntity<?> submitReview(
            @PathVariable UUID productId,
            @RequestParam("orderId") UUID orderId,
            @RequestParam("rating") int rating,
            @RequestParam(value = "comment", required = false) String comment,
            @RequestParam(value = "photos", required = false) List<MultipartFile> photos) {
        try {
            UUID userId = getAuthenticatedUserId();
            ProductReviewDto created = reviewService.createReview(userId, productId, orderId, rating, comment, photos);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/api/checkout/my-reviews")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Retorna todas as avaliações realizadas pelo usuário autenticado")
    public ResponseEntity<List<ProductReviewDto>> getMyReviews() {
        UUID userId = getAuthenticatedUserId();
        return ResponseEntity.ok(reviewService.getMyReviews(userId));
    }

    /* =========================================================================
       ROTAS ADMINISTRATIVAS (Moderação)
       ========================================================================= */

    @GetMapping("/api/admin/reviews")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Lista todas as avaliações para moderação do administrador")
    public ResponseEntity<List<ProductReviewDto>> getAllReviewsAdmin() {
        return ResponseEntity.ok(reviewService.getAllAdmin());
    }

    @PatchMapping("/api/admin/reviews/{id}/reply")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Responde oficialmente a uma avaliação de cliente")
    public ResponseEntity<ProductReviewDto> replyReview(
            @PathVariable UUID id,
            @RequestBody Map<String, String> payload) {
        String reply = payload.get("reply");
        return ResponseEntity.ok(reviewService.replyReviewAdmin(id, reply));
    }

    @PatchMapping("/api/admin/reviews/{id}/visibility")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Alterna a visibilidade pública de uma avaliação")
    public ResponseEntity<ProductReviewDto> toggleVisibility(
            @PathVariable UUID id,
            @RequestBody Map<String, Boolean> payload) {
        boolean visible = Boolean.TRUE.equals(payload.get("visible"));
        return ResponseEntity.ok(reviewService.toggleVisibilityAdmin(id, visible));
    }

    @DeleteMapping("/api/admin/reviews/{id}")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Exclui uma avaliação e remove suas fotos do armazenamento")
    public ResponseEntity<?> deleteReview(@PathVariable UUID id) {
        reviewService.deleteReviewAdmin(id);
        return ResponseEntity.noContent().build();
    }

    private UUID getAuthenticatedUserId() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new RuntimeException("Usuário não autenticado");
        }
        return UUID.fromString((String) auth.getPrincipal());
    }
}
