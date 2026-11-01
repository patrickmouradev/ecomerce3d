package com.print3d.ecommerce.repository;

import com.print3d.ecommerce.model.PushSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, UUID> {

    Optional<PushSubscription> findByEndpoint(String endpoint);

    List<PushSubscription> findByUserIdAndActiveTrue(UUID userId);

    List<PushSubscription> findByActiveTrue();

    /**
     * Busca inscrições ativas com base no NOME da Role.
     * NUNCA assume que o UUID da role seja o mesmo em DEV e PRD.
     */
    @Query("SELECT DISTINCT ps FROM PushSubscription ps JOIN ps.user u JOIN u.roles r WHERE r.name = :roleName AND ps.active = true")
    List<PushSubscription> findByRoleNameAndActiveTrue(@Param("roleName") String roleName);

    long countByActiveTrue();

    long countByDeviceTypeIgnoreCaseAndActiveTrue(String deviceType);
}
