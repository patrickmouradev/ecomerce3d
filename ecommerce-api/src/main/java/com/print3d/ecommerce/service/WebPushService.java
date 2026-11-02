package com.print3d.ecommerce.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.print3d.ecommerce.config.WebPushConfig;
import com.print3d.ecommerce.dto.PushBroadcastRequestDto;
import com.print3d.ecommerce.dto.PushCampaignResponseDto;
import com.print3d.ecommerce.dto.PushStatsDto;
import com.print3d.ecommerce.dto.PushSubscribeRequestDto;
import com.print3d.ecommerce.model.PushCampaign;
import com.print3d.ecommerce.model.PushDeliveryReceipt;
import com.print3d.ecommerce.model.PushSubscription;
import com.print3d.ecommerce.model.User;
import com.print3d.ecommerce.repository.PushCampaignRepository;
import com.print3d.ecommerce.repository.PushDeliveryReceiptRepository;
import com.print3d.ecommerce.repository.PushSubscriptionRepository;
import com.print3d.ecommerce.repository.UserRepository;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import org.apache.http.HttpResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class WebPushService {

    private static final Logger log = LoggerFactory.getLogger(WebPushService.class);

    private final PushService pushService;
    private final WebPushConfig webPushConfig;
    private final PushSubscriptionRepository pushSubscriptionRepository;
    private final PushCampaignRepository pushCampaignRepository;
    private final PushDeliveryReceiptRepository pushDeliveryReceiptRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public WebPushService(PushService pushService,
                          WebPushConfig webPushConfig,
                          PushSubscriptionRepository pushSubscriptionRepository,
                          PushCampaignRepository pushCampaignRepository,
                          PushDeliveryReceiptRepository pushDeliveryReceiptRepository,
                          UserRepository userRepository,
                          ObjectMapper objectMapper) {
        this.pushService = pushService;
        this.webPushConfig = webPushConfig;
        this.pushSubscriptionRepository = pushSubscriptionRepository;
        this.pushCampaignRepository = pushCampaignRepository;
        this.pushDeliveryReceiptRepository = pushDeliveryReceiptRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    public String getPublicKey() {
        return webPushConfig.getResolvedPublicKey();
    }

    @Transactional
    public PushSubscription subscribe(User user, PushSubscribeRequestDto dto) {
        log.info("Recebida inscrição Push para usuário ID: {}", user.getId());

        PushSubscription subscription = pushSubscriptionRepository.findByEndpoint(dto.getEndpoint())
                .orElse(PushSubscription.builder()
                        .endpoint(dto.getEndpoint())
                        .build());

        subscription.setUser(user);
        subscription.setP256dh(dto.getP256dh());
        subscription.setAuth(dto.getAuth());
        subscription.setActive(true);

        if (dto.getDeviceType() != null && !dto.getDeviceType().isBlank()) {
            subscription.setDeviceType(dto.getDeviceType().toLowerCase().trim());
        } else {
            subscription.setDeviceType("desktop");
        }

        if (dto.getUserAgent() != null) {
            subscription.setUserAgent(dto.getUserAgent().length() > 500
                    ? dto.getUserAgent().substring(0, 500)
                    : dto.getUserAgent());
        }

        return pushSubscriptionRepository.save(subscription);
    }

    @Transactional
    public void unsubscribe(String endpoint) {
        pushSubscriptionRepository.findByEndpoint(endpoint).ifPresent(sub -> {
            sub.setActive(false);
            pushSubscriptionRepository.save(sub);
            log.info("Inscrição Push desativada com sucesso para endpoint: {}", endpoint);
        });
    }

    @Transactional
    public int sendToUser(User user, String title, String body, String url) {
        List<PushSubscription> subscriptions = pushSubscriptionRepository.findByUserIdAndActiveTrue(user.getId());
        if (subscriptions.isEmpty()) {
            log.info("Nenhuma inscrição Push ativa encontrada para usuário {}", user.getEmail());
            return 0;
        }

        int successCount = 0;
        for (PushSubscription sub : subscriptions) {
            boolean ok = sendNotification(sub, title, body, url, null);
            if (ok) {
                successCount++;
            }
        }
        return successCount;
    }

    @Transactional
    public PushCampaign sendBroadcast(PushBroadcastRequestDto dto, User adminUser) {
        log.info("Iniciando disparo Push: '{}' (Segmento: {}, Email: {}) por {}",
                dto.getTitle(), dto.getTargetRole(), dto.getTargetEmail(), adminUser.getEmail());

        User targetUser = null;
        if (dto.getTargetEmail() != null && !dto.getTargetEmail().isBlank()) {
            targetUser = userRepository.findByEmail(dto.getTargetEmail().trim()).orElse(null);
        }

        PushCampaign campaign = PushCampaign.builder()
                .title(dto.getTitle())
                .body(dto.getBody())
                .targetUrl(dto.getTargetUrl() != null && !dto.getTargetUrl().isBlank() ? dto.getTargetUrl() : "/")
                .targetRole(dto.getTargetRole())
                .targetUser(targetUser)
                .createdByUser(adminUser)
                .build();

        campaign = pushCampaignRepository.save(campaign);

        List<PushSubscription> targets;
        if (targetUser != null) {
            targets = pushSubscriptionRepository.findByUserIdAndActiveTrue(targetUser.getId());
        } else if (dto.getTargetRole() != null &&
                   (dto.getTargetRole().equalsIgnoreCase("ADMINISTRADOR") ||
                    dto.getTargetRole().equalsIgnoreCase("FINANCEIRO") ||
                    dto.getTargetRole().equalsIgnoreCase("USUARIO"))) {
            targets = pushSubscriptionRepository.findByRoleNameAndActiveTrue(dto.getTargetRole().toUpperCase());
        } else {
            targets = pushSubscriptionRepository.findByActiveTrue();
        }

        int total = targets.size();
        int success = 0;
        int failed = 0;

        for (PushSubscription sub : targets) {
            boolean ok = sendNotification(sub, dto.getTitle(), dto.getBody(), campaign.getTargetUrl(), campaign);
            if (ok) {
                success++;
            } else {
                failed++;
            }
        }

        campaign.setTotalTargeted(total);
        campaign.setTotalSuccess(success);
        campaign.setTotalFailed(failed);

        return pushCampaignRepository.save(campaign);
    }

    public boolean sendNotification(PushSubscription sub, String title, String body, String url, PushCampaign campaign) {
        int statusCode = 0;
        String statusText = "ERRO_DESCONHECIDO";

        try {
            ObjectNode payload = objectMapper.createObjectNode();
            payload.put("title", title);
            payload.put("body", body);
            payload.put("url", url != null && !url.isBlank() ? url : "/");
            payload.put("icon", "/pwa-192x192.png");
            payload.put("badge", "/favicon.png");
            payload.put("timestamp", System.currentTimeMillis());

            byte[] payloadBytes = objectMapper.writeValueAsString(payload).getBytes(StandardCharsets.UTF_8);

            Notification notification = new Notification(
                    sub.getEndpoint(),
                    sub.getP256dh(),
                    sub.getAuth(),
                    payloadBytes
            );

            HttpResponse response = pushService.send(notification);
            statusCode = response.getStatusLine().getStatusCode();

            if (statusCode >= 200 && statusCode < 300) {
                statusText = "ENTREGUE";
                log.info("Push enviado com sucesso para sub {}. HTTP {}", sub.getId(), statusCode);
            } else if (statusCode == 404 || statusCode == 410) {
                statusText = "EXPIRADO";
                log.warn("Assinatura Push expirada/desinstalada (HTTP {}). Desativando sub {}", statusCode, sub.getId());
                sub.setActive(false);
                pushSubscriptionRepository.save(sub);
            } else {
                statusText = "FALHA_GATEWAY";
                log.warn("Falha no envio Push para sub {}. HTTP: {}", sub.getId(), statusCode);
            }
        } catch (Exception e) {
            statusText = "FALHA_ENVIO: " + (e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName());
            log.error("Exceção ao disparar Push para sub {}: {}", sub.getId(), e.getMessage());
        }

        if (campaign != null) {
            PushDeliveryReceipt receipt = PushDeliveryReceipt.builder()
                    .campaign(campaign)
                    .subscription(sub)
                    .user(sub.getUser())
                    .status(statusText.length() > 30 ? statusText.substring(0, 30) : statusText)
                    .httpStatusCode(statusCode > 0 ? statusCode : null)
                    .build();
            pushDeliveryReceiptRepository.save(receipt);
        }

        return "ENTREGUE".equals(statusText);
    }

    public PushStatsDto getStats() {
        return PushStatsDto.builder()
                .totalActiveSubscriptions(pushSubscriptionRepository.countByActiveTrue())
                .androidSubscriptions(pushSubscriptionRepository.countByDeviceTypeIgnoreCaseAndActiveTrue("android"))
                .iosSubscriptions(pushSubscriptionRepository.countByDeviceTypeIgnoreCaseAndActiveTrue("ios"))
                .desktopSubscriptions(pushSubscriptionRepository.countByDeviceTypeIgnoreCaseAndActiveTrue("desktop"))
                .totalCampaignsSent(pushCampaignRepository.count())
                .build();
    }

    public List<PushCampaignResponseDto> listCampaigns() {
        return pushCampaignRepository.findAllWithUsersOrderByCreatedAtDesc().stream()
                .map(c -> PushCampaignResponseDto.builder()
                        .id(c.getId())
                        .title(c.getTitle())
                        .body(c.getBody())
                        .targetUrl(c.getTargetUrl())
                        .targetRole(c.getTargetRole())
                        .targetEmail(c.getTargetUser() != null ? c.getTargetUser().getEmail() : null)
                        .totalTargeted(c.getTotalTargeted())
                        .totalSuccess(c.getTotalSuccess())
                        .totalFailed(c.getTotalFailed())
                        .createdBy(c.getCreatedByUser() != null ? c.getCreatedByUser().getName() : "Sistema")
                        .createdAt(c.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }
}
