package com.print3d.ecommerce.external.mercadopago;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MercadoPagoPaymentResponseDto {
    private String paymentId;
    private String status; // approved, pending, rejected
    private String statusDetail;
    private String qrCode;      // Se PIX
    private String qrCodeBase64;
    private String ticketUrl;   // Se boleto
}
