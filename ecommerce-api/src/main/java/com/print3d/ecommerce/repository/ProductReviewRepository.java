package com.print3d.ecommerce.repository;

import com.print3d.ecommerce.model.ProductReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductReviewRepository extends JpaRepository<ProductReview, UUID> {

    @Query("SELECT r FROM ProductReview r JOIN FETCH r.user u JOIN FETCH r.product p WHERE r.product.id = :productId AND r.visible = true ORDER BY r.createdAt DESC")
    List<ProductReview> findVisibleByProductId(@Param("productId") UUID productId);

    @Query("SELECT r FROM ProductReview r JOIN FETCH r.user u JOIN FETCH r.product p ORDER BY r.createdAt DESC")
    List<ProductReview> findAllWithDetails();

    Optional<ProductReview> findByOrderIdAndProductId(UUID orderId, UUID productId);

    @Query("SELECT COUNT(r) FROM ProductReview r WHERE r.product.id = :productId AND r.visible = true")
    long countVisibleByProductId(@Param("productId") UUID productId);

    @Query("SELECT AVG(r.rating) FROM ProductReview r WHERE r.product.id = :productId AND r.visible = true")
    Double getAverageRatingByProductId(@Param("productId") UUID productId);

    @Query("SELECT r FROM ProductReview r WHERE r.user.id = :userId")
    List<ProductReview> findByUserId(@Param("userId") UUID userId);

    @Query("SELECT COUNT(o) > 0 FROM Order o JOIN o.items i WHERE o.id = :orderId AND o.user.id = :userId AND o.status = 'ENTREGUE' AND i.product.id = :productId")
    boolean isOrderDeliveredAndContainsProduct(@Param("orderId") UUID orderId, @Param("userId") UUID userId, @Param("productId") UUID productId);
}
