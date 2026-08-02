package com.print3d.ecommerce.external.mercadopago;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class MercadoPagoPaymentRequestDto {
    private String description;
    private BigDecimal transactionAmount;
    private String paymentMethodId; // pix, bolbradesco, master, visa, etc.
    private String email;
    private int installments;
    private String token; // Token de cartão de crédito se aplicável
}
