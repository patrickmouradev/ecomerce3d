package com.print3d.ecommerce.controller;

import com.print3d.ecommerce.dto.PushSubscribeRequestDto;
import com.print3d.ecommerce.model.User;
import com.print3d.ecommerce.repository.UserRepository;
import com.print3d.ecommerce.service.WebPushService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/push")
@Tag(name = "Push Notifications", description = "Endpoints de gerenciamento de inscrições e chaves Web Push")
public class WebPushController {

    private final WebPushService webPushService;
    private final UserRepository userRepository;

    public WebPushController(WebPushService webPushService, UserRepository userRepository) {
        this.webPushService = webPushService;
        this.userRepository = userRepository;
    }

    @GetMapping("/public-key")
    @Operation(summary = "Retorna a chave pública VAPID do servidor para assinatura no navegador")
    public ResponseEntity<Map<String, String>> getPublicKey() {
        return ResponseEntity.ok(Map.of("publicKey", webPushService.getPublicKey()));
    }

    @PostMapping("/subscribe")
    @Operation(summary = "Salva ou reativa a inscrição Web Push do usuário autenticado")
    public ResponseEntity<Map<String, Object>> subscribe(@Valid @RequestBody PushSubscribeRequestDto dto) {
        User user = getAuthenticatedUser();
        var sub = webPushService.subscribe(user, dto);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Inscrição Push registrada com sucesso",
                "subscriptionId", sub.getId()
        ));
    }

    @PostMapping("/unsubscribe")
    @Operation(summary = "Desativa uma inscrição Web Push por endpoint")
    public ResponseEntity<Map<String, Object>> unsubscribe(@RequestBody Map<String, String> body) {
        String endpoint = body.get("endpoint");
        if (endpoint != null && !endpoint.isBlank()) {
            webPushService.unsubscribe(endpoint);
        }
        return ResponseEntity.ok(Map.of("success", true, "message", "Inscrição removida"));
    }

    private User getAuthenticatedUser() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new RuntimeException("Usuário não autenticado");
        }
        UUID userId = UUID.fromString((String) auth.getPrincipal());
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
    }
}
