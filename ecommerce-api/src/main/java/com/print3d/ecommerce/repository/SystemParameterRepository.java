package com.print3d.ecommerce.repository;

import com.print3d.ecommerce.model.SystemParameter;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SystemParameterRepository extends JpaRepository<SystemParameter, UUID> {

    Optional<SystemParameter> findByDescription(String description);

    @Query("SELECT p FROM SystemParameter p WHERE p.active = true " +
           "AND (:description IS NULL OR LOWER(p.description) LIKE LOWER(CONCAT('%', CAST(:description AS string), '%'))) " +
           "AND (p.createdAt >= COALESCE(:startDate, p.createdAt)) " +
           "AND (p.createdAt <= COALESCE(:endDate, p.createdAt))")
    List<SystemParameter> searchActiveParameters(@Param("description") String description,
                                                 @Param("startDate") LocalDateTime startDate,
                                                 @Param("endDate") LocalDateTime endDate,
                                                 Sort sort);
}
