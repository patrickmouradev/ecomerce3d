package com.print3d.ecommerce.repository;

import com.print3d.ecommerce.model.SiteVisitLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface SiteVisitLogRepository extends JpaRepository<SiteVisitLog, UUID> {

    List<SiteVisitLog> findAllByOrderByCreatedAtDesc(Pageable pageable);

    long countByCreatedAtAfter(LocalDateTime since);

    @Query("SELECT COUNT(DISTINCT s.visitorId) FROM SiteVisitLog s WHERE s.createdAt >= :since")
    long countDistinctVisitorsSince(@Param("since") LocalDateTime since);

    @Query("SELECT COUNT(DISTINCT s.visitorId) FROM SiteVisitLog s")
    long countTotalDistinctVisitors();

    @Query("SELECT COUNT(DISTINCT s.userId) FROM SiteVisitLog s WHERE s.userId IS NOT NULL")
    long countTotalIdentifiedUsers();

    @Query("SELECT s.productName, COUNT(s) as totalViews, COUNT(DISTINCT s.visitorId) as uniqueViewers " +
           "FROM SiteVisitLog s " +
           "WHERE s.productName IS NOT NULL AND s.eventType IN ('PRODUCT_VIEW', 'ADD_TO_CART') " +
           "GROUP BY s.productName " +
           "ORDER BY COUNT(s) DESC")
    List<Object[]> findTopViewedProducts(Pageable pageable);

    @Modifying
    @Query("UPDATE SiteVisitLog s SET s.userId = :userId, s.userName = :userName, s.userEmail = :userEmail WHERE s.visitorId = :visitorId AND s.userId IS NULL")
    int backfillVisitorIdentity(@Param("visitorId") String visitorId,
                                @Param("userId") UUID userId,
                                @Param("userName") String userName,
                                @Param("userEmail") String userEmail);
}
