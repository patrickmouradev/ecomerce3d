package com.print3d.ecommerce.repository;

import com.print3d.ecommerce.model.Accessory;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AccessoryRepository extends JpaRepository<Accessory, UUID> {

    List<Accessory> findByActiveTrue(Sort sort);

    @Query("SELECT a FROM Accessory a WHERE a.active = true " +
           "AND (:search IS NULL OR LOWER(a.description) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))")
    List<Accessory> searchActiveAccessories(@Param("search") String search, Sort sort);
}
