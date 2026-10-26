package com.print3d.ecommerce.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponseDto {
    private String id;
    private Long orderNumber;
    private String clientName;
    private String clientEmail;
    private String customerPhone;
    private String status; // PENDENTE, PAGO, ENVIADO, CANCELADO
    private String paymentMethod;
    private String paymentStatusDetail;
    private BigDecimal shippingCost;
    private BigDecimal totalAmount;
    private String mercadoPagoPaymentId;
    private String trackingCode;
    private String pixQrCode;
    private String pixQrCodeBase64;
    private AddressDto shippingAddress;
    private String createdAt;
    private boolean simulatedPayment;
    private long unreadBuyerMessages;
    private long unreadSellerMessages;
    private List<OrderItemDto> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItemDto {
        private String id;
        private String productId;
        private String productName;
        private int quantity;
        private BigDecimal price;
    }
}
