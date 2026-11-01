package com.print3d.ecommerce.controller;

import com.print3d.ecommerce.dto.PushBroadcastRequestDto;
import com.print3d.ecommerce.dto.PushCampaignResponseDto;
import com.print3d.ecommerce.dto.PushStatsDto;
import com.print3d.ecommerce.model.PushCampaign;
import com.print3d.ecommerce.model.User;
import com.print3d.ecommerce.repository.UserRepository;
import com.print3d.ecommerce.service.WebPushService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/push")
@Tag(name = "Admin Push Notifications", description = "Painel administrativo para gestão, métricas e disparo de Push Notifications")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasAnyRole('ADMINISTRADOR', 'FINANCEIRO')")
public class AdminPushController {

    private final WebPushService webPushService;
    private final UserRepository userRepository;

    public AdminPushController(WebPushService webPushService, UserRepository userRepository) {
        this.webPushService = webPushService;
        this.userRepository = userRepository;
    }

    @GetMapping("/stats")
    @Operation(summary = "Métricas agregadas de aparelhos inscritos por plataforma e campanhas enviadas")
    public ResponseEntity<PushStatsDto> getStats() {
        return ResponseEntity.ok(webPushService.getStats());
    }

    @GetMapping("/campaigns")
    @Operation(summary = "Histórico de disparos de notificações push manuais e automáticas")
    public ResponseEntity<List<PushCampaignResponseDto>> listCampaigns() {
        return ResponseEntity.ok(webPushService.listCampaigns());
    }

    @PostMapping("/broadcast")
    @Operation(summary = "Dispara campanha de Notificação Push com segmentação por perfil ou e-mail")
    public ResponseEntity<PushCampaignResponseDto> sendBroadcast(@Valid @RequestBody PushBroadcastRequestDto dto) {
        User adminUser = getAuthenticatedUser();
        PushCampaign campaign = webPushService.sendBroadcast(dto, adminUser);

        PushCampaignResponseDto response = PushCampaignResponseDto.builder()
                .id(campaign.getId())
                .title(campaign.getTitle())
                .body(campaign.getBody())
                .targetUrl(campaign.getTargetUrl())
                .targetRole(campaign.getTargetRole())
                .targetEmail(campaign.getTargetUser() != null ? campaign.getTargetUser().getEmail() : null)
                .totalTargeted(campaign.getTotalTargeted())
                .totalSuccess(campaign.getTotalSuccess())
                .totalFailed(campaign.getTotalFailed())
                .createdBy(adminUser.getName())
                .createdAt(campaign.getCreatedAt())
                .build();

        return ResponseEntity.ok(response);
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
