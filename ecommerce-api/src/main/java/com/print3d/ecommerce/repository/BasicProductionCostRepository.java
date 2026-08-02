package com.print3d.ecommerce.repository;

import com.print3d.ecommerce.model.BasicProductionCost;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BasicProductionCostRepository extends JpaRepository<BasicProductionCost, UUID> {

    Optional<BasicProductionCost> findByDescription(String description);

    List<BasicProductionCost> findByActiveTrue();

    @Query("SELECT c FROM BasicProductionCost c WHERE c.active = true " +
           "AND (:description IS NULL OR LOWER(c.description) LIKE LOWER(CONCAT('%', CAST(:description AS string), '%'))) " +
           "AND (c.createdAt >= COALESCE(:startDate, c.createdAt)) " +
           "AND (c.createdAt <= COALESCE(:endDate, c.createdAt))")
    List<BasicProductionCost> searchActiveCosts(@Param("description") String description,
                                                @Param("startDate") LocalDate startDate,
                                                @Param("endDate") LocalDate endDate,
                                                Sort sort);
}
