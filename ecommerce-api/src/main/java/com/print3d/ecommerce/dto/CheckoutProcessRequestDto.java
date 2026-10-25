package com.print3d.ecommerce.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckoutProcessRequestDto {
    private List<CheckoutShippingRequestDto.CartItemInput> items;

    // Dados do Cliente e Entrega
    private String customerName;
    private String cpf;
    private String phone;
    private AddressDto address;
    private Integer shippingServiceId; // ID do serviço selecionado no Melhor Envio (ex: 1=PAC, 2=SEDEX, 3=Jadlog)

    // Dados provenientes do Mercado Pago Payment Brick (onSubmit)
    private String paymentMethodId; // "pix", "visa", "master", etc.
    private String token;           // Token do cartão de crédito
    private String issuerId;        // ID do banco emissor
    private Integer installments;   // Número de parcelas
    private String payerEmail;
    private String payerIdentificationType;
    private String payerIdentificationNumber;
}
