package com.print3d.ecommerce.repository;

import com.print3d.ecommerce.model.Banner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BannerRepository extends JpaRepository<Banner, UUID> {

    @Query("SELECT b FROM Banner b JOIN FETCH b.product p WHERE b.active = true ORDER BY b.displayOrder ASC")
    List<Banner> findActiveBanners();

    @Query("SELECT b FROM Banner b JOIN FETCH b.product p ORDER BY b.displayOrder ASC")
    List<Banner> findAllBanners();
}
