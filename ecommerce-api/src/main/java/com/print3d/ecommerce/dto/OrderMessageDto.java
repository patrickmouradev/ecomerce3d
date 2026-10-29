package com.print3d.ecommerce.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderMessageDto {
    private String id;
    private String orderId;
    private String senderUserId;
    private String senderName;
    private String senderRole; // COMPRADOR ou VENDEDOR
    private String message;
    private String attachmentUrl;
    private String attachmentName;
    private String attachmentType;
    private String createdAt;
}
