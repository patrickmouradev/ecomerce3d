package com.print3d.ecommerce.repository;

import com.print3d.ecommerce.model.PushCampaign;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PushCampaignRepository extends JpaRepository<PushCampaign, UUID> {

    @Query("SELECT c FROM PushCampaign c LEFT JOIN FETCH c.createdByUser LEFT JOIN FETCH c.targetUser ORDER BY c.createdAt DESC")
    List<PushCampaign> findAllWithUsersOrderByCreatedAtDesc();

    long count();
}
