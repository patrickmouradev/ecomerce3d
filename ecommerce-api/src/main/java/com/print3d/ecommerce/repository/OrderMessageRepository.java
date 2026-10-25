package com.print3d.ecommerce.repository;

import com.print3d.ecommerce.model.OrderMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OrderMessageRepository extends JpaRepository<OrderMessage, UUID> {
    List<OrderMessage> findByOrderIdOrderByCreatedAtAsc(UUID orderId);
    long countByOrderId(UUID orderId);
}
