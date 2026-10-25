package com.print3d.ecommerce.model;

import com.print3d.ecommerce.cryptography.CryptographyConverter;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "tb_order")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "order_number", unique = true)
    private Long orderNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 50)
    private String status; // PENDENTE, PAGO, ENVIADO, CANCELADO

    @Column(name = "shipping_cost", nullable = false, precision = 10, scale = 2)
    private BigDecimal shippingCost;

    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "mercado_pago_payment_id")
    private String mercadoPagoPaymentId;

    @Column(name = "payment_method", length = 50)
    private String paymentMethod;

    @Column(name = "payment_status_detail", length = 100)
    private String paymentStatusDetail;

    @Column(name = "shipping_address_json", columnDefinition = "TEXT")
    @Convert(converter = CryptographyConverter.class)
    private String shippingAddressJson;

    @Column(name = "customer_phone")
    @Convert(converter = CryptographyConverter.class)
    private String customerPhone;

    @Column(name = "pix_qr_code", columnDefinition = "TEXT")
    private String pixQrCode;

    @Column(name = "pix_qr_code_base64", columnDefinition = "TEXT")
    private String pixQrCodeBase64;

    @Column(name = "tracking_code")
    private String trackingCode;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();
}
