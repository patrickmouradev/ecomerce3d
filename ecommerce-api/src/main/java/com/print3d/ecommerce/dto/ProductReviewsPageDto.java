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
public class ProductReviewsPageDto {
    private boolean enabled;
    private int minReviewsRequired;
    private long totalReviews;
    private double averageRating;
    private List<ProductReviewDto> reviews;
}
