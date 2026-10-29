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
public class ProductReviewDto {
    private String id;
    private String productId;
    private String productName;
    private String orderId;
    private String authorName; // Ex: "Patrick M." (privacidade)
    private Integer rating;
    private String comment;
    private List<String> photosUrls;
    private String adminReply;
    private String adminRepliedAt;
    private boolean visible;
    private String createdAt;
}
