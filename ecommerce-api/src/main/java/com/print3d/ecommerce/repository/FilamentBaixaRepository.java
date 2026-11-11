package com.print3d.ecommerce.repository;

import com.print3d.ecommerce.model.FilamentBaixa;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FilamentBaixaRepository extends JpaRepository<FilamentBaixa, UUID> {

    @Query("SELECT b FROM FilamentBaixa b JOIN FETCH b.filament f " +
           "WHERE (:search IS NULL OR " +
           "LOWER(f.material) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
           "LOWER(f.brand) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
           "LOWER(f.color) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
           "LOWER(COALESCE(b.reason, '')) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))")
    List<FilamentBaixa> searchBaixas(@Param("search") String search, Sort sort);
}
