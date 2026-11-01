package com.print3d.ecommerce.repository;

import com.print3d.ecommerce.model.PushDeliveryReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PushDeliveryReceiptRepository extends JpaRepository<PushDeliveryReceipt, UUID> {

    List<PushDeliveryReceipt> findByCampaignId(UUID campaignId);

    long countByStatus(String status);
}
