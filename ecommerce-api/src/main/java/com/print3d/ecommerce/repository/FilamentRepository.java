package com.print3d.ecommerce.repository;

import com.print3d.ecommerce.model.Filament;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FilamentRepository extends JpaRepository<Filament, UUID> {

    @Query("SELECT f FROM Filament f WHERE f.active = true " +
           "AND (:material IS NULL OR LOWER(f.material) LIKE LOWER(CONCAT('%', CAST(:material AS string), '%'))) " +
           "AND (:brand IS NULL OR LOWER(f.brand) LIKE LOWER(CONCAT('%', CAST(:brand AS string), '%'))) " +
           "AND (:color IS NULL OR LOWER(f.color) LIKE LOWER(CONCAT('%', CAST(:color AS string), '%')))")
    List<Filament> searchActiveFilaments(@Param("material") String material,
                                         @Param("brand") String brand,
                                         @Param("color") String color,
                                         Sort sort);
}
