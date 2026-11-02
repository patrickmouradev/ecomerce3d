package com.print3d.ecommerce.service;

import com.print3d.ecommerce.model.Order;
import com.print3d.ecommerce.repository.OrderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PendingOrderPushScheduler {

    private static final Logger log = LoggerFactory.getLogger(PendingOrderPushScheduler.class);

    private final OrderRepository orderRepository;
    private final WebPushService webPushService;

    public PendingOrderPushScheduler(OrderRepository orderRepository, WebPushService webPushService) {
        this.orderRepository = orderRepository;
        this.webPushService = webPushService;
    }

    /**
     * Executa diariamente às 13:00 (Fuso horário de Brasília).
     * Regra anti-spam estrita:
     * - Primeiras 3 notificações: no máximo 1 a cada 24 horas para pedidos pendentes com mais de 24h.
     * - Notificações subsequentes: no máximo 1 a cada 15 dias.
     */
    @Scheduled(cron = "0 0 13 * * ?", zone = "America/Sao_Paulo")
    @Transactional
    public void processPendingOrdersPush() {
        log.info("Iniciando rotina diária das 13:00: Verificação de Pedidos Pendentes para Push...");

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime limite24h = now.minusHours(24);
        LocalDateTime limite15dias = now.minusDays(15);

        List<Order> eligibleOrders = orderRepository.findPendingOrdersEligibleForPush(limite24h, limite24h, limite15dias);

        if (eligibleOrders.isEmpty()) {
            log.info("Nenhum pedido pendente elegível para notificação Push hoje.");
            return;
        }

        log.info("Encontrados {} pedidos pendentes elegíveis para notificação Push.", eligibleOrders.size());

        for (Order order : eligibleOrders) {
            try {
                if (order.getUser() == null) {
                    continue;
                }

                String title = String.format("Seu pedido #%d está aguardando!", order.getOrderNumber());
                String body = "Finalize seu pagamento para garantir a impressão 3D das suas peças com envio prioritário.";
                String url = "/meus-pedidos";

                int sentCount = webPushService.sendToUser(order.getUser(), title, body, url);

                if (sentCount > 0) {
                    order.setPendingPushCount(order.getPendingPushCount() + 1);
                    order.setLastPendingPushAt(now);
                    orderRepository.save(order);
                    log.info("Push enviado para usuário {} referente ao pedido #{}. Total de envios: {}",
                            order.getUser().getEmail(), order.getOrderNumber(), order.getPendingPushCount());
                } else {
                    log.debug("Usuário {} do pedido #{} não possui dispositivos inscritos no Push.",
                            order.getUser().getEmail(), order.getOrderNumber());
                }
            } catch (Exception e) {
                log.error("Erro ao processar notificação Push do pedido #{}: {}", order.getOrderNumber(), e.getMessage());
            }
        }

        log.info("Rotina diária de Pedidos Pendentes concluída.");
    }
}
