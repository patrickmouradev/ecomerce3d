package com.print3d.ecommerce.external.mercadopago;

import java.math.BigDecimal;

public class MercadoPagoBuilder {

    private String description;
    private BigDecimal transactionAmount;
    private String paymentMethodId = "pix";
    private String email;
    private int installments = 1;
    private String token;

    public MercadoPagoBuilder comDescricao(String description) {
        this.description = description;
        return this;
    }

    public MercadoPagoBuilder comValor(BigDecimal value) {
        this.transactionAmount = value;
        return this;
    }

    public MercadoPagoBuilder comMetodo(String method) {
        this.paymentMethodId = method;
        return this;
    }

    public MercadoPagoBuilder paraEmail(String email) {
        this.email = email;
        return this;
    }

    public MercadoPagoBuilder comParcelas(int installments) {
        this.installments = installments;
        return this;
    }

    public MercadoPagoBuilder comTokenCartao(String token) {
        this.token = token;
        return this;
    }

    public MercadoPagoPaymentRequestDto build() {
        if (transactionAmount == null || transactionAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Valor da transação deve ser positivo");
        }
        if (email == null || email.isEmpty()) {
            throw new IllegalArgumentException("E-mail do comprador é obrigatório");
        }
        return MercadoPagoPaymentRequestDto.builder()
                .description(description)
                .transactionAmount(transactionAmount)
                .paymentMethodId(paymentMethodId)
                .email(email)
                .installments(installments)
                .token(token)
                .build();
    }
}
