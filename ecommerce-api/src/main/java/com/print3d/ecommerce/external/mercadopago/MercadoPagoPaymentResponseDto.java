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
    private String status;       // approved, pending, in_process, rejected, cancelled
    private String statusDetail; // accredited, pending_waiting_transfer, etc.
    private String qrCode;       // Código PIX Copia-e-Cola
    private String qrCodeBase64; // Imagem QR Code em Base64
    private String ticketUrl;    // URL externa se houver
    private boolean simulated;   // Indica se foi gerado pelo fallback de simulação
}
