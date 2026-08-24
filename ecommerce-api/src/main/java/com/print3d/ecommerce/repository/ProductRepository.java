package com.print3d.ecommerce.repository;

import com.print3d.ecommerce.model.Product;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID> {

    @Query("SELECT DISTINCT p FROM Product p LEFT JOIN FETCH p.filaments pf LEFT JOIN FETCH pf.filament f WHERE p.active = true " +
           "AND (:query IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', CAST(:query AS string), '%')) " +
           "OR LOWER(p.description) LIKE LOWER(CONCAT('%', CAST(:query AS string), '%')))")
    List<Product> searchCatalog(@Param("query") String query, Sort sort);

    @Query("SELECT DISTINCT p FROM Product p LEFT JOIN FETCH p.filaments pf LEFT JOIN FETCH pf.filament f WHERE " +
           "(:query IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', CAST(:query AS string), '%')) " +
           "OR LOWER(p.description) LIKE LOWER(CONCAT('%', CAST(:query AS string), '%')))")
    List<Product> searchAll(@Param("query") String query, Sort sort);
}
