package com.print3d.ecommerce.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.print3d.ecommerce.dto.AddressDto;
import com.print3d.ecommerce.dto.CheckoutProcessRequestDto;
import com.print3d.ecommerce.dto.CheckoutShippingRequestDto;
import com.print3d.ecommerce.dto.OrderMessageDto;
import com.print3d.ecommerce.dto.OrderResponseDto;
import com.print3d.ecommerce.external.melhorenvio.MelhorEnvioRequestDto;
import com.print3d.ecommerce.external.melhorenvio.MelhorEnvioResponseDto;
import com.print3d.ecommerce.external.melhorenvio.MelhorEnvioService;
import com.print3d.ecommerce.external.mercadopago.MercadoPagoPaymentRequestDto;
import com.print3d.ecommerce.external.mercadopago.MercadoPagoPaymentResponseDto;
import com.print3d.ecommerce.external.mercadopago.MercadoPagoService;
import com.print3d.ecommerce.model.*;
import com.print3d.ecommerce.repository.OrderMessageRepository;
import com.print3d.ecommerce.repository.OrderRepository;
import com.print3d.ecommerce.repository.ProductRepository;
import com.print3d.ecommerce.repository.SystemParameterRepository;
import com.print3d.ecommerce.repository.UserRepository;
import com.print3d.ecommerce.util.DatePatterns;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class CheckoutService {

    private static final Logger log = LoggerFactory.getLogger(CheckoutService.class);
    private static final String DEFAULT_CEP_ORIGEM = "09894280";

    @org.springframework.beans.factory.annotation.Value("${app.external.melhorenvio.cep-origem:09894280}")
    private String configuredCepOrigem;

    @org.springframework.beans.factory.annotation.Value("${app.external.whatsapp.number:}")
    private String configuredWhatsappLoja;

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final OrderMessageRepository orderMessageRepository;
    private final UserRepository userRepository;
    private final SystemParameterRepository systemParameterRepository;
    private final MelhorEnvioService melhorEnvioService;
    private final MercadoPagoService mercadoPagoService;
    private final OrderEmailService orderEmailService;
    private final ObjectMapper objectMapper;

    public CheckoutService(ProductRepository productRepository,
                           OrderRepository orderRepository,
                           OrderMessageRepository orderMessageRepository,
                           UserRepository userRepository,
                           SystemParameterRepository systemParameterRepository,
                           MelhorEnvioService melhorEnvioService,
                           MercadoPagoService mercadoPagoService,
                           OrderEmailService orderEmailService,
                           ObjectMapper objectMapper) {
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.orderMessageRepository = orderMessageRepository;
        this.userRepository = userRepository;
        this.systemParameterRepository = systemParameterRepository;
        this.melhorEnvioService = melhorEnvioService;
        this.mercadoPagoService = mercadoPagoService;
        this.orderEmailService = orderEmailService;
        this.objectMapper = objectMapper;
    }

    /**
     * Calcula o frete no Melhor Envio com base no CEP de destino e no peso real das peças 3D no banco de dados.
     */
    @Transactional(readOnly = true)
    public MelhorEnvioResponseDto calculateShipping(CheckoutShippingRequestDto request) {
        String cleanCepDestino = request.getZipCode() != null ? request.getZipCode().replaceAll("\\D", "") : "";
        if (cleanCepDestino.length() != 8) {
            if (request.getShippingServiceId() != null && request.getShippingServiceId() == 0) {
                return MelhorEnvioResponseDto.builder()
                        .valorFrete(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP))
                        .prazoEntregaDias(1)
                        .servicoId(0)
                        .servicoNome("Retirada com o Vendedor")
                        .simulado(false)
                        .opcoes(List.of())
                        .build();
            }
            throw new IllegalArgumentException("Informe um CEP válido com 8 dígitos");
        }

        double totalWeightGrams = 0.0;
        if (request.getItems() != null) {
            for (CheckoutShippingRequestDto.CartItemInput item : request.getItems()) {
                Product product = productRepository.findById(item.getProductId())
                        .orElseThrow(() -> new RuntimeException("Produto não encontrado: " + item.getProductId()));
                double productWeightG = calculateProductWeightGrams(product);
                totalWeightGrams += productWeightG * Math.max(1, item.getQuantity());
            }
        }

        // Peso mínimo de 300g (0.3 kg) para encomenda no Melhor Envio
        double pesoKg = Math.max(0.3, totalWeightGrams / 1000.0);
        String cepOrigem = resolveCepOrigem();

        return melhorEnvioService.calcularFrete(MelhorEnvioRequestDto.builder()
                .cepOrigem(cepOrigem)
                .cepDestino(cleanCepDestino)
                .pesoKg(pesoKg)
                .comprimentoCm(20)
                .alturaCm(15)
                .larguraCm(20)
                .servicoIdPreferencial(request.getShippingServiceId())
                .build());
    }

    /**
     * Processa o fechamento do pedido:
     * 1. Salva/atualiza CPF, Telefone e Endereço no perfil do cliente (Opção A)
     * 2. Recalcula subtotal dos produtos e frete no servidor (proteção contra adulteração no front-end)
     * 3. Cria o pedido e envia o pagamento (PIX ou Cartão) ao Mercado Pago
     */
    @Transactional
    public OrderResponseDto processCheckout(UUID userId, CheckoutProcessRequestDto request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("O carrinho está vazio");
        }

        String cleanCpf = request.getCpf() != null ? request.getCpf().replaceAll("\\D", "") : "";
        if (cleanCpf.length() < 11) {
            throw new IllegalArgumentException("CPF/CNPJ válido é obrigatório para emissão do pagamento");
        }

        AddressDto address = request.getAddress();
        if (address == null || address.getZipCode() == null || address.getZipCode().replaceAll("\\D", "").length() != 8) {
            throw new IllegalArgumentException("Endereço de entrega completo com CEP válido é obrigatório");
        }

        // 1. Atualiza os dados no perfil do cliente para próximas compras
        if (request.getCustomerName() != null && !request.getCustomerName().trim().isEmpty()) {
            user.setName(request.getCustomerName().trim());
        }
        user.setCpf(cleanCpf);
        if (request.getPhone() != null && !request.getPhone().trim().isEmpty()) {
            address.setPhone(request.getPhone().trim());
        }

        String addressJsonStr;
        try {
            addressJsonStr = objectMapper.writeValueAsString(address);
            user.setAddressJson(addressJsonStr);
            userRepository.save(user);
        } catch (Exception e) {
            throw new RuntimeException("Erro ao salvar endereço de entrega", e);
        }

        // 2. Calcula os itens e o valor real no servidor
        BigDecimal subtotal = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();
        List<String> productNames = new ArrayList<>();

        Order order = Order.builder()
                .orderNumber(orderRepository.getNextOrderNumber())
                .user(user)
                .status("PENDENTE")
                .shippingAddressJson(addressJsonStr)
                .customerPhone(address.getPhone())
                .paymentMethod(request.getPaymentMethodId())
                .build();

        for (CheckoutShippingRequestDto.CartItemInput cartItem : request.getItems()) {
            Product product = productRepository.findById(cartItem.getProductId())
                    .orElseThrow(() -> new RuntimeException("Produto não encontrado: " + cartItem.getProductId()));
            if (!product.isActive()) {
                throw new RuntimeException("O produto '" + product.getName() + "' não está mais disponível");
            }
            int qty = Math.max(1, cartItem.getQuantity());
            BigDecimal unitPrice = product.getSalePriceParticular();
            subtotal = subtotal.add(unitPrice.multiply(BigDecimal.valueOf(qty)));

            orderItems.add(OrderItem.builder()
                    .order(order)
                    .product(product)
                    .quantity(qty)
                    .price(unitPrice)
                    .build());
            productNames.add(qty + "x " + product.getName());
        }

        // 3. Calcula o frete no servidor via Melhor Envio
        MelhorEnvioResponseDto shippingResponse = calculateShipping(CheckoutShippingRequestDto.builder()
                .zipCode(address.getZipCode())
                .shippingServiceId(request.getShippingServiceId())
                .items(request.getItems())
                .build());

        BigDecimal shippingCost = shippingResponse.getValorFrete().setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalAmount = subtotal.add(shippingCost).setScale(2, RoundingMode.HALF_UP);

        order.setShippingCost(shippingCost);
        order.setTotalAmount(totalAmount);
        order.setItems(orderItems);

        // Salva inicialmente para obter o UUID do pedido (external_reference)
        order = orderRepository.save(order);

        String fullName = user.getName() != null ? user.getName().trim() : "Cliente 3DPrintPNG";
        String firstName = fullName;
        String lastName = "Cliente";
        int spaceIdx = fullName.indexOf(' ');
        if (spaceIdx > 0) {
            firstName = fullName.substring(0, spaceIdx).trim();
            lastName = fullName.substring(spaceIdx + 1).trim();
        }

        // Fluxo PIX Direto via Chat com o Vendedor (sem passar pelo Mercado Pago no front-end)
        boolean isPixChatFlow = request.getPaymentMethodId() == null
                || request.getPaymentMethodId().isBlank()
                || "pix_chat".equalsIgnoreCase(request.getPaymentMethodId())
                || "pix_direto".equalsIgnoreCase(request.getPaymentMethodId());

        if (isPixChatFlow) {
            order.setPaymentMethod("PIX");
            order.setPaymentStatusDetail("aguardando_pix_chat");
            order.setStatus("PENDENTE");
            order = orderRepository.save(order);

            String displayOrderNumber = order.getOrderNumber() != null
                    ? String.valueOf(order.getOrderNumber())
                    : order.getId().toString().substring(0, 8);
            String itemsSummary = String.join(", ", productNames);
            String welcomeMsg = String.format(
                    "Olá, %s! Recebemos seu pedido #%s (%s) — %s (Frete: R$ %s | Total: R$ %s).\n\n" +
                    "Segue os dados para pagamento via PIX:\n" +
                    "Chave : 21958651800\n" +
                    "Titular : Patrick Jose de Moura\n\n" +
                    "Assim que realizar o pagamento, nos avise por aqui!",
                    firstName,
                    displayOrderNumber,
                    itemsSummary,
                    shippingResponse.getServicoNome(),
                    shippingCost.toPlainString().replace('.', ','),
                    totalAmount.toPlainString().replace('.', ',')
            );

            OrderMessage autoMessage = OrderMessage.builder()
                    .order(order)
                    .senderUserId(null)
                    .senderName("3DPrintPNG (Vendedor)")
                    .senderRole("VENDEDOR")
                    .message(welcomeMsg)
                    .build();
            orderMessageRepository.save(autoMessage);

            orderEmailService.sendOrderCreatedEmail(order, shippingResponse.getServicoNome());

            return toOrderResponseDto(order);
        }

        // 4. Fluxo Mercado Pago (mantido no Back-end para uso futuro)
        String identificationNumber = request.getPayerIdentificationNumber() != null
                && !request.getPayerIdentificationNumber().trim().isEmpty()
                ? request.getPayerIdentificationNumber().replaceAll("\\D", "")
                : cleanCpf;

        String identificationType = request.getPayerIdentificationType() != null
                && !request.getPayerIdentificationType().trim().isEmpty()
                ? request.getPayerIdentificationType()
                : (identificationNumber.length() > 11 ? "CNPJ" : "CPF");

        String payerEmail = request.getPayerEmail() != null && !request.getPayerEmail().trim().isEmpty()
                ? request.getPayerEmail().trim()
                : user.getEmail();

        MercadoPagoPaymentRequestDto mpRequest = MercadoPagoPaymentRequestDto.builder()
                .externalReference(order.getId().toString())
                .description("3DPrintPNG - " + String.join(", ", productNames))
                .transactionAmount(totalAmount)
                .paymentMethodId(request.getPaymentMethodId() != null ? request.getPaymentMethodId() : "pix")
                .token(request.getToken())
                .issuerId(request.getIssuerId())
                .installments(request.getInstallments() != null ? request.getInstallments() : 1)
                .email(payerEmail)
                .firstName(firstName)
                .lastName(lastName)
                .identificationType(identificationType)
                .identificationNumber(identificationNumber)
                .zipCode(address.getZipCode())
                .streetName(address.getStreetName())
                .streetNumber(address.getStreetNumber())
                .neighborhood(address.getNeighborhood())
                .city(address.getCity())
                .federalUnit(address.getFederalUnit())
                .build();

        MercadoPagoPaymentResponseDto mpResponse = mercadoPagoService.criarPagamento(mpRequest);

        if ("rejected".equalsIgnoreCase(mpResponse.getStatus())) {
            order.setStatus("CANCELADO");
            order.setMercadoPagoPaymentId(mpResponse.getPaymentId());
            order.setPaymentStatusDetail(mpResponse.getStatusDetail());
            orderRepository.save(order);
            throw new RuntimeException("Pagamento recusado pela operadora (" + mpResponse.getStatusDetail() + "). Verifique os dados do cartão ou escolha PIX.");
        }

        order.setMercadoPagoPaymentId(mpResponse.getPaymentId());
        order.setPaymentStatusDetail(mpResponse.getStatusDetail());
        order.setPixQrCode(mpResponse.getQrCode());
        order.setPixQrCodeBase64(mpResponse.getQrCodeBase64());

        if ("approved".equalsIgnoreCase(mpResponse.getStatus())) {
            order.setStatus("PAGO");
        } else {
            order.setStatus("PENDENTE");
        }

        order = orderRepository.save(order);
        orderEmailService.sendOrderCreatedEmail(order, shippingResponse.getServicoNome());
        return toOrderResponseDto(order);
    }

    /**
     * Consulta e sincroniza o status do pedido no Mercado Pago (usado pelo Polling a cada 5s da tela do PIX).
     */
    @Transactional
    public OrderResponseDto checkAndSyncOrderStatus(UUID userId, UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Pedido não encontrado"));

        if (!order.getUser().getId().equals(userId)) {
            throw new RuntimeException("Acesso negado a este pedido");
        }

        if ("PENDENTE".equalsIgnoreCase(order.getStatus())
                && order.getMercadoPagoPaymentId() != null
                && !order.getMercadoPagoPaymentId().startsWith("SIM-")) {
            try {
                MercadoPagoPaymentResponseDto mpStatus = mercadoPagoService.consultarPagamento(order.getMercadoPagoPaymentId());
                updateOrderFromMercadoPagoStatus(order, mpStatus);
            } catch (Exception e) {
                log.warn("Falha ao sincronizar status do pedido {} no Mercado Pago: {}", orderId, e.getMessage());
            }
        }

        return toOrderResponseDto(order);
    }

    /**
     * Permite aprovar um pagamento PIX em modo simulado (quando as chaves ainda são TEST-XXXX).
     */
    @Transactional
    public OrderResponseDto simulateApproveOrder(UUID userId, UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Pedido não encontrado"));

        if (!order.getUser().getId().equals(userId)) {
            throw new RuntimeException("Acesso negado a este pedido");
        }

        order.setStatus("PAGO");
        order.setPaymentStatusDetail("accredited_simulated");
        order = orderRepository.save(order);
        orderEmailService.sendOrderStatusUpdatedEmail(order);
        return toOrderResponseDto(order);
    }

    /**
     * Processa notificação assíncrona do Webhook do Mercado Pago.
     */
    @Transactional
    public void processWebhookNotification(String paymentId) {
        if (paymentId == null || paymentId.trim().isEmpty()) {
            return;
        }
        log.info("Recebida notificação de Webhook do Mercado Pago para paymentId={}", paymentId);

        orderRepository.findByMercadoPagoPaymentId(paymentId.trim()).ifPresent(order -> {
            MercadoPagoPaymentResponseDto mpStatus = mercadoPagoService.consultarPagamento(paymentId.trim());
            updateOrderFromMercadoPagoStatus(order, mpStatus);
        });
    }

    @Transactional(readOnly = true)
    public List<OrderResponseDto> getMyOrders(UUID userId) {
        return orderRepository.findByUserIdWithUser(userId)
                .stream()
                .map(this::toOrderResponseDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<OrderResponseDto> getAllOrdersAdmin() {
        return orderRepository.findAllOrdersWithUsers()
                .stream()
                .map(this::toOrderResponseDto)
                .toList();
    }

    private void updateOrderFromMercadoPagoStatus(Order order, MercadoPagoPaymentResponseDto mpStatus) {
        if (mpStatus == null || mpStatus.getStatus() == null) return;

        String previousStatus = order.getStatus();
        order.setPaymentStatusDetail(mpStatus.getStatusDetail());
        if ("approved".equalsIgnoreCase(mpStatus.getStatus())) {
            order.setStatus("PAGO");
            log.info("Pedido {} atualizado para PAGO via confirmação do Mercado Pago!", order.getId());
        } else if ("cancelled".equalsIgnoreCase(mpStatus.getStatus()) || "rejected".equalsIgnoreCase(mpStatus.getStatus())) {
            order.setStatus("CANCELADO");
            log.info("Pedido {} atualizado para CANCELADO via Mercado Pago.", order.getId());
        }
        order = orderRepository.save(order);
        if (previousStatus == null || !previousStatus.equalsIgnoreCase(order.getStatus())) {
            orderEmailService.sendOrderStatusUpdatedEmail(order);
        }
    }

    public OrderResponseDto toOrderResponseDto(Order order) {
        AddressDto shippingAddress = null;
        if (order.getShippingAddressJson() != null && !order.getShippingAddressJson().isEmpty()) {
            try {
                shippingAddress = objectMapper.readValue(order.getShippingAddressJson(), AddressDto.class);
            } catch (Exception ignored) {
            }
        }

        List<OrderResponseDto.OrderItemDto> itemDtos = order.getItems() != null
                ? order.getItems().stream()
                .map(i -> OrderResponseDto.OrderItemDto.builder()
                        .id(i.getId() != null ? i.getId().toString() : null)
                        .productId(i.getProduct() != null && i.getProduct().getId() != null ? i.getProduct().getId().toString() : null)
                        .productName(i.getProduct() != null ? i.getProduct().getName() : "Peça 3D")
                        .quantity(i.getQuantity())
                        .price(i.getPrice())
                        .build())
                .toList()
                : List.of();

        boolean simulated = order.getMercadoPagoPaymentId() != null && order.getMercadoPagoPaymentId().startsWith("SIM-");

        return OrderResponseDto.builder()
                .id(order.getId().toString())
                .orderNumber(order.getOrderNumber())
                .clientName(order.getUser() != null ? order.getUser().getName() : "Cliente")
                .clientEmail(order.getUser() != null ? order.getUser().getEmail() : null)
                .customerPhone(order.getCustomerPhone())
                .status(order.getStatus())
                .paymentMethod(order.getPaymentMethod())
                .paymentStatusDetail(order.getPaymentStatusDetail())
                .shippingCost(order.getShippingCost())
                .totalAmount(order.getTotalAmount())
                .mercadoPagoPaymentId(order.getMercadoPagoPaymentId())
                .trackingCode(order.getTrackingCode())
                .pixQrCode(order.getPixQrCode())
                .pixQrCodeBase64(order.getPixQrCodeBase64())
                .shippingAddress(shippingAddress)
                .createdAt(order.getCreatedAt() != null ? order.getCreatedAt().format(DatePatterns.DATE_FORMATTER) : "")
                .simulatedPayment(simulated)
                .items(itemDtos)
                .build();
    }

    private double calculateProductWeightGrams(Product product) {
        if (product.getFilaments() == null || product.getFilaments().isEmpty()) {
            return 150.0; // Peso padrão 150g caso não tenha filamento associado
        }
        return product.getFilaments().stream()
                .map(ProductFilament::getWeightG)
                .filter(w -> w != null)
                .mapToDouble(BigDecimal::doubleValue)
                .sum();
    }

    private String resolveCepOrigem() {
        return systemParameterRepository.findByDescription("CEP Origem")
                .filter(SystemParameter::isActive)
                .map(SystemParameter::getParamValue)
                .map(v -> v.replaceAll("\\D", ""))
                .filter(v -> v.length() == 8 && !v.equals("11700000") && !v.equals("00000000"))
                .orElseGet(() -> {
                    String envCep = configuredCepOrigem != null ? configuredCepOrigem.replaceAll("\\D", "") : "";
                    if (envCep.length() == 8 && !envCep.equals("11700000") && !envCep.equals("00000000")) {
                        return envCep;
                    }
                    return DEFAULT_CEP_ORIGEM;
                });
    }

    @Transactional(readOnly = true)
    public String resolveWhatsappLoja() {
        return systemParameterRepository.findByDescription("WhatsApp Loja")
                .filter(SystemParameter::isActive)
                .map(SystemParameter::getParamValue)
                .map(v -> v.replaceAll("\\D", ""))
                .filter(v -> !v.isEmpty())
                .orElseGet(() -> configuredWhatsappLoja != null ? configuredWhatsappLoja.replaceAll("\\D", "") : "");
    }

    @Transactional(readOnly = true)
    public List<OrderMessageDto> getOrderMessages(UUID userId, boolean isAdmin, UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Pedido não encontrado"));

        if (!isAdmin && !order.getUser().getId().equals(userId)) {
            throw new RuntimeException("Acesso negado às mensagens deste pedido");
        }

        return orderMessageRepository.findByOrderIdOrderByCreatedAtAsc(orderId)
                .stream()
                .map(this::toOrderMessageDto)
                .toList();
    }

    @Transactional
    public OrderMessageDto sendOrderMessage(UUID userId, boolean asSeller, boolean hasAdminRole, UUID orderId, String messageText) {
        if (messageText == null || messageText.trim().isEmpty()) {
            throw new IllegalArgumentException("A mensagem não pode estar vazia");
        }

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Pedido não encontrado"));

        if (!hasAdminRole && !order.getUser().getId().equals(userId)) {
            throw new RuntimeException("Acesso negado para enviar mensagem neste pedido");
        }

        User sender = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        boolean isSellerMessage = asSeller && hasAdminRole;
        String senderRole = isSellerMessage ? "VENDEDOR" : "COMPRADOR";
        String senderName = isSellerMessage
                ? (sender.getName() != null ? sender.getName() + " (Vendedor)" : "3DPrintPNG (Vendedor)")
                : (sender.getName() != null ? sender.getName() : "Comprador");

        OrderMessage saved = orderMessageRepository.save(OrderMessage.builder()
                .order(order)
                .senderUserId(sender.getId())
                .senderName(senderName)
                .senderRole(senderRole)
                .message(messageText.trim())
                .build());

        if (!isSellerMessage) {
            orderEmailService.sendAdminBuyerChatMessageNotification(order, saved);
        }

        return toOrderMessageDto(saved);
    }

    private OrderMessageDto toOrderMessageDto(OrderMessage msg) {
        return OrderMessageDto.builder()
                .id(msg.getId() != null ? msg.getId().toString() : null)
                .orderId(msg.getOrder() != null && msg.getOrder().getId() != null ? msg.getOrder().getId().toString() : null)
                .senderUserId(msg.getSenderUserId() != null ? msg.getSenderUserId().toString() : null)
                .senderName(msg.getSenderName())
                .senderRole(msg.getSenderRole())
                .message(msg.getMessage())
                .createdAt(msg.getCreatedAt() != null ? msg.getCreatedAt().format(DatePatterns.DATE_TIME_FORMATTER) : "")
                .build();
    }
}
