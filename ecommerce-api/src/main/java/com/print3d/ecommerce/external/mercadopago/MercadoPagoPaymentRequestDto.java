package com.print3d.ecommerce.external.mercadopago;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MercadoPagoPaymentRequestDto {
    private String externalReference;   // ID do Pedido (tb_order.id)
    private String description;
    private BigDecimal transactionAmount;
    private String paymentMethodId;     // pix, master, visa, elo, etc.
    private String issuerId;            // ID do banco emissor (cartão)
    private Integer installments;       // Parcelas (1 para PIX)
    private String token;               // Token gerado pelo Payment Brick (cartão)

    // Dados do Pagador (Payer)
    private String email;
    private String firstName;
    private String lastName;
    private String identificationType;   // CPF ou CNPJ
    private String identificationNumber; // Somente números

    // Endereço do Pagador
    private String zipCode;
    private String streetName;
    private String streetNumber;
    private String neighborhood;
    private String city;
    private String federalUnit;
}
