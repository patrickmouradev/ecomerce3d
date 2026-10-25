package com.print3d.ecommerce.service;

import com.print3d.ecommerce.model.Order;
import com.print3d.ecommerce.model.OrderItem;
import com.print3d.ecommerce.model.OrderMessage;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@Service
public class OrderEmailService {

    private static final Logger log = LoggerFactory.getLogger(OrderEmailService.class);
    private static final String[] ADMIN_NOTIFICATION_EMAILS = {
            "patrickmoura@gmail.com",
            "natalybgmoura87@gmail.com"
    };

    private final JavaMailSender mailSender;

    @Value("${app.mail.from-address:3dprintpng@gmail.com}")
    private String mailFrom;

    @Value("${app.frontend.url:https://3dprintpng.com.br}")
    private String frontendUrl;

    public OrderEmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Dispara o e-mail de confirmação de pedido recém-criado para o cliente.
     */
    public void sendOrderCreatedEmail(Order order, String shippingServiceName) {
        if (order == null || order.getUser() == null || order.getUser().getEmail() == null) {
            return;
        }

        String recipientEmail = order.getUser().getEmail().trim();
        String customerName = extractFirstName(order.getUser().getName());
        String orderNum = formatOrderNumber(order);
        String subject = String.format("3DPrintPNG - Recebemos seu Pedido #%s! (Aguardando PIX)", orderNum);

        String title = String.format("Pedido #%s Recebido!", orderNum);
        String messageHtml = String.format(
                "<p style=\"margin:0 0 12px 0;\">Olá, <strong style=\"color:#ffffff;\">%s</strong>! Muito obrigado por comprar na <strong style=\"color:#00f0ff;\">3DPrintPNG</strong>.</p>" +
                "<p style=\"margin:0 0 14px 0;\">Recebemos o seu pedido com sucesso! Para concluir o pagamento via PIX, utilize os dados abaixo e confirme conosco no <strong style=\"color:#ffffff;\">Chat do Pedido</strong> em nosso site (ou pelo WhatsApp):</p>" +
                "<div style=\"background:rgba(0, 255, 136, 0.08);border:1px solid #00ff88;border-radius:10px;padding:14px 18px;margin:14px 0;\">" +
                "  <div style=\"font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#00ff88;font-weight:800;margin-bottom:6px;\">Dados para Pagamento PIX</div>" +
                "  <div style=\"font-size:15px;color:#ffffff;margin-bottom:4px;\"><strong>Chave :</strong> <span style=\"color:#00f0ff;font-family:monospace;font-weight:700;\">21958651800</span></div>" +
                "  <div style=\"font-size:15px;color:#ffffff;\"><strong>Titular :</strong> Patrick Jose de Moura</div>" +
                "</div>",
                escapeHtml(customerName)
        );

        String statusLabel = "PENDENTE (Aguardando Pagamento PIX)";
        String statusBgColor = "rgba(255, 193, 7, 0.15)";
        String statusBorderColor = "#ffc107";
        String statusTextColor = "#ffc107";
        String buttonText = "Abrir Chat do Pedido e Pagar com PIX";

        String itemsTableHtml = buildItemsTableHtml(order, shippingServiceName);
        String trackingHtml = buildTrackingHtml(order.getTrackingCode());
        String fullHtml = buildEmailWrapper(title, messageHtml, statusLabel, statusBgColor, statusBorderColor, statusTextColor, itemsTableHtml, trackingHtml, buttonText, "/my-orders");

        dispatchAsync(new String[]{recipientEmail}, subject, fullHtml, orderNum);

        // Notifica também os administradores sobre a nova venda
        sendAdminNewSaleNotification(order, shippingServiceName);
    }

    /**
     * Dispara e-mail para os administradores (patrickmoura@gmail.com e natalybgmoura87@gmail.com)
     * toda vez que uma nova venda for realizada.
     */
    public void sendAdminNewSaleNotification(Order order, String shippingServiceName) {
        if (order == null) {
            return;
        }

        String orderNum = formatOrderNumber(order);
        String clientFullName = order.getUser() != null && order.getUser().getName() != null
                ? order.getUser().getName().trim()
                : "Cliente";
        String clientEmail = order.getUser() != null && order.getUser().getEmail() != null
                ? order.getUser().getEmail().trim()
                : "-";
        String clientPhone = order.getCustomerPhone() != null && !order.getCustomerPhone().isBlank()
                ? order.getCustomerPhone().trim()
                : "-";
        String totalStr = formatMoney(order.getTotalAmount());
        String deliveryMode = (shippingServiceName != null && !shippingServiceName.isBlank())
                ? shippingServiceName
                : (order.getShippingCost() != null && order.getShippingCost().compareTo(BigDecimal.ZERO) <= 0
                        ? "Retirada com o Vendedor"
                        : "Correios");

        String subject = String.format("3DPrintPNG - [NOVA VENDA] Pedido #%s — %s (R$ %s)", orderNum, clientFullName, totalStr);
        String title = String.format("Nova Venda Realizada! Pedido #%s 🎉", orderNum);

        String messageHtml = String.format(
                "<p style=\"margin:0 0 14px 0;\">Uma nova venda acaba de ser registrada na <strong style=\"color:#00f0ff;\">3DPrintPNG</strong>!</p>" +
                "<div style=\"background:#161b22;border:1px solid #30363d;border-radius:10px;padding:16px 18px;margin:14px 0;\">" +
                "  <div style=\"font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#00f0ff;font-weight:800;margin-bottom:8px;\">Dados do Cliente</div>" +
                "  <div style=\"font-size:14px;color:#e6edf3;margin-bottom:4px;\"><strong>Cliente:</strong> %s</div>" +
                "  <div style=\"font-size:14px;color:#e6edf3;margin-bottom:4px;\"><strong>E-mail:</strong> %s</div>" +
                "  <div style=\"font-size:14px;color:#e6edf3;margin-bottom:4px;\"><strong>Telefone / WhatsApp:</strong> %s</div>" +
                "  <div style=\"font-size:14px;color:#e6edf3;\"><strong>Entrega:</strong> %s</div>" +
                "</div>",
                escapeHtml(clientFullName),
                escapeHtml(clientEmail),
                escapeHtml(clientPhone),
                escapeHtml(deliveryMode)
        );

        String statusLabel = order.getStatus() != null ? order.getStatus().toUpperCase() : "PENDENTE";
        String itemsTableHtml = buildItemsTableHtml(order, deliveryMode);
        String fullHtml = buildEmailWrapper(
                title,
                messageHtml,
                statusLabel,
                "rgba(0, 255, 136, 0.15)",
                "#00ff88",
                "#00ff88",
                itemsTableHtml,
                "",
                "Abrir Painel Administrativo (Dashboard)",
                "/admin"
        );

        dispatchAsync(ADMIN_NOTIFICATION_EMAILS, subject, fullHtml, orderNum);
    }

    /**
     * Dispara e-mail para os administradores (patrickmoura@gmail.com e natalybgmoura87@gmail.com)
     * toda vez que um cliente enviar uma mensagem no chat do pedido.
     */
    public void sendAdminBuyerChatMessageNotification(Order order, OrderMessage buyerMessage) {
        if (order == null || buyerMessage == null) {
            return;
        }

        String orderNum = formatOrderNumber(order);
        String clientFullName = order.getUser() != null && order.getUser().getName() != null
                ? order.getUser().getName().trim()
                : (buyerMessage.getSenderName() != null ? buyerMessage.getSenderName() : "Cliente");
        String clientEmail = order.getUser() != null && order.getUser().getEmail() != null
                ? order.getUser().getEmail().trim()
                : "-";
        String clientPhone = order.getCustomerPhone() != null && !order.getCustomerPhone().isBlank()
                ? order.getCustomerPhone().trim()
                : "-";
        String messageText = buyerMessage.getMessage() != null ? buyerMessage.getMessage().trim() : "";

        String subject = String.format("3DPrintPNG - [MENSAGEM NO CHAT] Pedido #%s — %s", orderNum, clientFullName);
        String title = String.format("Nova Mensagem de Cliente — Pedido #%s 💬", orderNum);

        String messageHtml = String.format(
                "<p style=\"margin:0 0 14px 0;\">O cliente <strong style=\"color:#ffffff;\">%s</strong> enviou uma nova mensagem no chat do <strong style=\"color:#00f0ff;\">Pedido #%s</strong>:</p>" +
                "<div style=\"background:rgba(0, 240, 255, 0.08);border-left:4px solid #00f0ff;border-radius:8px;padding:16px 18px;margin:16px 0;\">" +
                "  <div style=\"font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#00f0ff;font-weight:800;margin-bottom:6px;\">Mensagem do Cliente</div>" +
                "  <div style=\"font-size:15px;color:#ffffff;white-space:pre-wrap;line-height:1.5;\">%s</div>" +
                "</div>" +
                "<div style=\"background:#161b22;border:1px solid #30363d;border-radius:10px;padding:14px 18px;margin:14px 0;\">" +
                "  <div style=\"font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#8b949e;font-weight:700;margin-bottom:6px;\">Dados do Cliente</div>" +
                "  <div style=\"font-size:14px;color:#e6edf3;margin-bottom:4px;\"><strong>Cliente:</strong> %s</div>" +
                "  <div style=\"font-size:14px;color:#e6edf3;margin-bottom:4px;\"><strong>E-mail:</strong> %s</div>" +
                "  <div style=\"font-size:14px;color:#e6edf3;\"><strong>Telefone / WhatsApp:</strong> %s</div>" +
                "</div>",
                escapeHtml(clientFullName),
                orderNum,
                escapeHtml(messageText),
                escapeHtml(clientFullName),
                escapeHtml(clientEmail),
                escapeHtml(clientPhone)
        );

        String statusLabel = order.getStatus() != null ? order.getStatus().toUpperCase() : "PENDENTE";
        String itemsTableHtml = buildItemsTableHtml(order, null);
        String fullHtml = buildEmailWrapper(
                title,
                messageHtml,
                statusLabel,
                "rgba(0, 240, 255, 0.15)",
                "#00f0ff",
                "#00f0ff",
                itemsTableHtml,
                buildTrackingHtml(order.getTrackingCode()),
                "Responder Cliente no Dashboard",
                "/admin"
        );

        dispatchAsync(ADMIN_NOTIFICATION_EMAILS, subject, fullHtml, orderNum);
    }

    /**
     * Dispara o e-mail de atualização de status (PAGO, ENVIADO, ENTREGUE, CANCELADO) para o cliente.
     */
    public void sendOrderStatusUpdatedEmail(Order order) {
        if (order == null || order.getUser() == null || order.getUser().getEmail() == null) {
            return;
        }

        String recipientEmail = order.getUser().getEmail().trim();
        String customerName = extractFirstName(order.getUser().getName());
        String orderNum = formatOrderNumber(order);
        String status = order.getStatus() != null ? order.getStatus().trim().toUpperCase() : "PENDENTE";

        String subject;
        String title;
        String messageHtml;
        String statusLabel;
        String statusBgColor;
        String statusBorderColor;
        String statusTextColor;
        String buttonText;

        switch (status) {
            case "PAGO" -> {
                subject = String.format("3DPrintPNG - Pagamento Confirmado! Pedido #%s em Produção", orderNum);
                title = "Pagamento PIX Confirmado! 🎉";
                messageHtml = String.format(
                        "<p style=\"margin:0 0 12px 0;\">Olá, <strong style=\"color:#ffffff;\">%s</strong>! Confirmamos o recebimento do pagamento PIX do seu <strong style=\"color:#00f0ff;\">Pedido #%s</strong>.</p>" +
                        "<p style=\"margin:0;\">O status do seu pedido foi atualizado para <strong style=\"color:#00ff88;\">PAGO</strong> e suas peças já entraram na nossa fila de produção em impressão 3D! Assim que o envio/entrega estiver pronto, avisaremos você por aqui.</p>",
                        escapeHtml(customerName), orderNum
                );
                statusLabel = "PAGO (Em Produção 3D)";
                statusBgColor = "rgba(0, 255, 136, 0.15)";
                statusBorderColor = "#00ff88";
                statusTextColor = "#00ff88";
                buttonText = "Acompanhar Meu Pedido";
            }
            case "ENVIADO" -> {
                subject = String.format("3DPrintPNG - Seu Pedido #%s foi Enviado! 📦", orderNum);
                title = "Seu Pedido está a Caminho!";
                messageHtml = String.format(
                        "<p style=\"margin:0 0 12px 0;\">Olá, <strong style=\"color:#ffffff;\">%s</strong>! Temos uma ótima notícia: suas peças ficaram prontas e o seu <strong style=\"color:#00f0ff;\">Pedido #%s</strong> acaba de ser <strong style=\"color:#00f0ff;\">ENVIADO</strong>!</p>" +
                        "<p style=\"margin:0;\">Você pode acompanhar os detalhes da entrega diretamente em nosso site.</p>",
                        escapeHtml(customerName), orderNum
                );
                statusLabel = "ENVIADO";
                statusBgColor = "rgba(0, 240, 255, 0.15)";
                statusBorderColor = "#00f0ff";
                statusTextColor = "#00f0ff";
                buttonText = "Ver Detalhes e Rastreio no Site";
            }
            case "ENTREGUE" -> {
                subject = String.format("3DPrintPNG - Pedido #%s Entregue! Muito obrigado!", orderNum);
                title = String.format("Pedido #%s Entregue! 🙌", orderNum);
                messageHtml = String.format(
                        "<p style=\"margin:0 0 12px 0;\">Olá, <strong style=\"color:#ffffff;\">%s</strong>! O status do seu <strong style=\"color:#00f0ff;\">Pedido #%s</strong> foi atualizado para <strong style=\"color:#10b981;\">ENTREGUE</strong>.</p>" +
                        "<p style=\"margin:0;\">Agradecemos imensamente pela confiança em nosso trabalho! Esperamos que você goste muito das suas peças 3D. Sempre que precisar de novos projetos, colecionáveis ou peças personalizadas, conte com a <strong style=\"color:#00f0ff;\">3DPrintPNG</strong>!</p>",
                        escapeHtml(customerName), orderNum
                );
                statusLabel = "ENTREGUE";
                statusBgColor = "rgba(16, 185, 129, 0.18)";
                statusBorderColor = "#10b981";
                statusTextColor = "#10b981";
                buttonText = "Visitar a Loja 3DPrintPNG";
            }
            case "CANCELADO" -> {
                subject = String.format("3DPrintPNG - Atualização do Pedido #%s (Cancelado)", orderNum);
                title = String.format("Pedido #%s Cancelado", orderNum);
                messageHtml = String.format(
                        "<p style=\"margin:0 0 12px 0;\">Olá, <strong style=\"color:#ffffff;\">%s</strong>. Informamos que o status do seu <strong style=\"color:#ffffff;\">Pedido #%s</strong> foi atualizado para <strong style=\"color:#ff4d4f;\">CANCELADO</strong>.</p>" +
                        "<p style=\"margin:0;\">Caso tenha ocorrido algum engano ou você queira retomar sua compra, basta nos chamar no chat do site ou pelo WhatsApp que teremos prazer em ajudar!</p>",
                        escapeHtml(customerName), orderNum
                );
                statusLabel = "CANCELADO";
                statusBgColor = "rgba(255, 77, 79, 0.15)";
                statusBorderColor = "#ff4d4f";
                statusTextColor = "#ff4d4f";
                buttonText = "Acessar Meus Pedidos";
            }
            default -> {
                subject = String.format("3DPrintPNG - Atualização do Pedido #%s (%s)", orderNum, status);
                title = String.format("Atualização do Pedido #%s", orderNum);
                messageHtml = String.format(
                        "<p style=\"margin:0;\">Olá, <strong style=\"color:#ffffff;\">%s</strong>! O status do seu <strong style=\"color:#00f0ff;\">Pedido #%s</strong> foi atualizado para <strong style=\"color:#ffc107;\">%s</strong>.</p>",
                        escapeHtml(customerName), orderNum, escapeHtml(status)
                );
                statusLabel = status;
                statusBgColor = "rgba(255, 193, 7, 0.15)";
                statusBorderColor = "#ffc107";
                statusTextColor = "#ffc107";
                buttonText = "Acompanhar Meu Pedido";
            }
        }

        String itemsTableHtml = buildItemsTableHtml(order, null);
        String trackingHtml = buildTrackingHtml(order.getTrackingCode());
        String fullHtml = buildEmailWrapper(title, messageHtml, statusLabel, statusBgColor, statusBorderColor, statusTextColor, itemsTableHtml, trackingHtml, buttonText, "/my-orders");

        dispatchAsync(new String[]{recipientEmail}, subject, fullHtml, orderNum);
    }

    private String buildItemsTableHtml(Order order, String shippingServiceName) {
        StringBuilder rows = new StringBuilder();
        List<OrderItem> items = order.getItems();
        if (items != null) {
            for (OrderItem item : items) {
                String prodName = item.getProduct() != null && item.getProduct().getName() != null
                        ? item.getProduct().getName()
                        : "Produto 3D";
                int qty = Math.max(1, item.getQuantity());
                BigDecimal unitPrice = item.getPrice() != null ? item.getPrice() : BigDecimal.ZERO;
                BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(qty)).setScale(2, RoundingMode.HALF_UP);

                rows.append(String.format(
                        "<tr>" +
                        "<td style=\"padding:10px 0;border-bottom:1px solid #21262d;color:#e6edf3;font-size:14px;\"><strong>%dx</strong> %s</td>" +
                        "<td style=\"padding:10px 0;border-bottom:1px solid #21262d;color:#e6edf3;font-size:14px;text-align:right;white-space:nowrap;\">R$ %s</td>" +
                        "</tr>",
                        qty,
                        escapeHtml(prodName),
                        formatMoney(lineTotal)
                ));
            }
        }

        BigDecimal shippingCost = order.getShippingCost() != null ? order.getShippingCost() : BigDecimal.ZERO;
        String shippingDisplay;
        if (shippingCost.compareTo(BigDecimal.ZERO) <= 0) {
            shippingDisplay = (shippingServiceName != null && !shippingServiceName.isBlank())
                    ? escapeHtml(shippingServiceName) + " (Grátis)"
                    : "Retirada com o Vendedor (Grátis)";
        } else {
            shippingDisplay = (shippingServiceName != null && !shippingServiceName.isBlank())
                    ? escapeHtml(shippingServiceName) + " — R$ " + formatMoney(shippingCost)
                    : "R$ " + formatMoney(shippingCost);
        }

        BigDecimal totalAmount = order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO;

        return String.format(
                "<div style=\"background:#161b22;border:1px solid #30363d;border-radius:10px;padding:18px;margin-top:20px;\">" +
                "<div style=\"font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#8b949e;margin-bottom:10px;font-weight:700;\">Resumo do Pedido</div>" +
                "<table style=\"width:100%%;border-collapse:collapse;\">" +
                "<thead>" +
                "<tr>" +
                "<th style=\"text-align:left;padding-bottom:8px;border-bottom:1px solid #30363d;color:#8b949e;font-size:12px;\">Produto</th>" +
                "<th style=\"text-align:right;padding-bottom:8px;border-bottom:1px solid #30363d;color:#8b949e;font-size:12px;\">Valor</th>" +
                "</tr>" +
                "</thead>" +
                "<tbody>%s</tbody>" +
                "<tfoot>" +
                "<tr>" +
                "<td style=\"padding-top:12px;color:#8b949e;font-size:13px;\">Frete / Entrega</td>" +
                "<td style=\"padding-top:12px;color:#c9d1d9;font-size:13px;text-align:right;\">%s</td>" +
                "</tr>" +
                "<tr>" +
                "<td style=\"padding-top:10px;color:#ffffff;font-size:16px;font-weight:700;\">Valor Total</td>" +
                "<td style=\"padding-top:10px;color:#00ff88;font-size:18px;font-weight:800;text-align:right;\">R$ %s</td>" +
                "</tr>" +
                "</tfoot>" +
                "</table>" +
                "</div>",
                rows,
                shippingDisplay,
                formatMoney(totalAmount)
        );
    }

    private String buildTrackingHtml(String trackingCode) {
        if (trackingCode == null || trackingCode.trim().isEmpty()) {
            return "";
        }
        return String.format(
                "<div style=\"background:rgba(0, 240, 255, 0.08);border:1px dashed #00f0ff;border-radius:10px;padding:14px 18px;margin-top:18px;text-align:center;\">" +
                "<div style=\"font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#8b949e;margin-bottom:4px;\">Código de Rastreio Correios</div>" +
                "<div style=\"font-size:18px;font-weight:800;color:#00f0ff;letter-spacing:1.5px;font-family:monospace;\">%s</div>" +
                "</div>",
                escapeHtml(trackingCode.trim())
        );
    }

    private String buildEmailWrapper(String title,
                                     String messageHtml,
                                     String statusLabel,
                                     String statusBgColor,
                                     String statusBorderColor,
                                     String statusTextColor,
                                     String itemsTableHtml,
                                     String trackingHtml,
                                     String buttonText,
                                     String targetPath) {
        String cleanBaseUrl = frontendUrl != null ? frontendUrl.replaceAll("/+$", "") : "https://3dprintpng.com.br";
        String resolvedPath = (targetPath != null && !targetPath.isBlank()) ? targetPath : "/my-orders";
        String targetUrl = cleanBaseUrl + resolvedPath;

        return String.format(
                "<!DOCTYPE html>" +
                "<html lang=\"pt-BR\">" +
                "<head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1.0\"></head>" +
                "<body style=\"margin:0;padding:24px 12px;background-color:#070a0f;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e6edf3;\">" +
                "<div style=\"max-width:600px;margin:0 auto;background-color:#0d1117;border:1px solid #21262d;border-radius:14px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.5);\">" +
                "  <div style=\"background:linear-gradient(135deg,#0d1117 0%%,#161b22 100%%);padding:24px;text-align:center;border-bottom:2px solid #00f0ff;\">" +
                "    <div style=\"font-size:24px;font-weight:900;letter-spacing:1.5px;color:#ffffff;\">3DPrint<span style=\"color:#00f0ff;\">PNG</span></div>" +
                "    <div style=\"font-size:12px;color:#8b949e;margin-top:4px;\">Impressão 3D de Alta Precisão</div>" +
                "  </div>" +
                "  <div style=\"padding:28px 24px;\">" +
                "    <h1 style=\"margin:0 0 16px 0;font-size:22px;color:#ffffff;font-weight:800;\">%s</h1>" +
                "    <div style=\"margin-bottom:20px;\">" +
                "      <span style=\"display:inline-block;padding:6px 14px;border-radius:999px;font-size:12px;font-weight:800;letter-spacing:0.6px;background:%s;border:1px solid %s;color:%s;\">STATUS: %s</span>" +
                "    </div>" +
                "    <div style=\"font-size:15px;line-height:1.6;color:#c9d1d9;\">%s</div>" +
                "    %s" +
                "    %s" +
                "    <div style=\"text-align:center;margin-top:28px;\">" +
                "      <a href=\"%s\" target=\"_blank\" style=\"display:inline-block;padding:14px 28px;background:linear-gradient(90deg,#00f0ff 0%%,#00c3ff 100%%);color:#05080f;font-weight:800;font-size:14px;text-decoration:none;border-radius:8px;\">%s</a>" +
                "    </div>" +
                "  </div>" +
                "  <div style=\"background-color:#090d13;padding:18px 24px;text-align:center;border-top:1px solid #21262d;font-size:12px;color:#8b949e;\">" +
                "    <div>© 3DPrintPNG — Todos os direitos reservados.</div>" +
                "    <div style=\"margin-top:4px;\"><a href=\"%s\" style=\"color:#00f0ff;text-decoration:none;\">%s</a></div>" +
                "  </div>" +
                "</div>" +
                "</body>" +
                "</html>",
                title,
                statusBgColor, statusBorderColor, statusTextColor, escapeHtml(statusLabel),
                messageHtml,
                trackingHtml,
                itemsTableHtml,
                targetUrl,
                escapeHtml(buttonText),
                cleanBaseUrl,
                cleanBaseUrl
        );
    }

    private void dispatchAsync(String[] recipientEmails, String subject, String htmlBody, String orderNum) {
        CompletableFuture.runAsync(() -> {
            try {
                MimeMessage mimeMessage = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
                helper.setFrom(mailFrom);
                helper.setTo(recipientEmails);
                helper.setSubject(subject);
                helper.setText(htmlBody, true);
                mailSender.send(mimeMessage);
                log.info("E-mail do pedido #{} enviado com sucesso para {}", orderNum, String.join(", ", recipientEmails));
            } catch (Exception e) {
                log.error("Falha ao enviar e-mail do pedido #{} para {}: {}", orderNum, String.join(", ", recipientEmails), e.getMessage(), e);
            }
        });
    }

    private String formatOrderNumber(Order order) {
        if (order.getOrderNumber() != null) {
            return String.valueOf(order.getOrderNumber());
        }
        return order.getId() != null ? order.getId().toString().substring(0, 8) : "0";
    }

    private String extractFirstName(String fullName) {
        if (fullName == null || fullName.trim().isEmpty()) {
            return "Cliente";
        }
        String trimmed = fullName.trim();
        int idx = trimmed.indexOf(' ');
        return idx > 0 ? trimmed.substring(0, idx) : trimmed;
    }

    private String formatMoney(BigDecimal value) {
        if (value == null) {
            return "0,00";
        }
        return value.setScale(2, RoundingMode.HALF_UP).toPlainString().replace('.', ',');
    }

    private String escapeHtml(String input) {
        if (input == null) {
            return "";
        }
        return input
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
