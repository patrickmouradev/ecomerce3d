package com.print3d.ecommerce.repository;

import com.print3d.ecommerce.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {

    @Query("SELECT o FROM Order o JOIN FETCH o.user u ORDER BY o.createdAt DESC")
    List<Order> findAllOrdersWithUsers();
}
