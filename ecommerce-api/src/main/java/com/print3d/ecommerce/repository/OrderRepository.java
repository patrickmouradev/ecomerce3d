package com.print3d.ecommerce.repository;

import com.print3d.ecommerce.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {

    @Query("SELECT o FROM Order o JOIN FETCH o.user u ORDER BY o.createdAt DESC")
    List<Order> findAllOrdersWithUsers();

    @Query("SELECT o FROM Order o JOIN FETCH o.user u WHERE u.id = :userId ORDER BY o.createdAt DESC")
    List<Order> findByUserIdWithUser(@Param("userId") UUID userId);

    Optional<Order> findByMercadoPagoPaymentId(String mercadoPagoPaymentId);

    @Query("SELECT COUNT(oi) > 0 FROM OrderItem oi WHERE oi.product.id = :productId")
    boolean existsSalesByProductId(@Param("productId") UUID productId);

    @Query(value = "SELECT nextval('seq_order_number')", nativeQuery = true)
    Long getNextOrderNumber();

    @Query("SELECT o FROM Order o JOIN FETCH o.user u WHERE o.status = 'PENDENTE' " +
           "AND (" +
           "  (o.pendingPushCount < 3 AND o.createdAt <= :limite24h AND (o.lastPendingPushAt IS NULL OR o.lastPendingPushAt <= :limite24hUltimoPush)) " +
           "  OR " +
           "  (o.pendingPushCount >= 3 AND o.lastPendingPushAt <= :limite15dias)" +
           ")")
    List<Order> findPendingOrdersEligibleForPush(
            @Param("limite24h") java.time.LocalDateTime limite24h,
            @Param("limite24hUltimoPush") java.time.LocalDateTime limite24hUltimoPush,
            @Param("limite15dias") java.time.LocalDateTime limite15dias
    );
}
