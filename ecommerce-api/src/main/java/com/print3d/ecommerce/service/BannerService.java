package com.print3d.ecommerce.service;

import com.print3d.ecommerce.dto.BannerDto;
import com.print3d.ecommerce.model.Banner;
import com.print3d.ecommerce.model.Product;
import com.print3d.ecommerce.repository.BannerRepository;
import com.print3d.ecommerce.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class BannerService {

    private final BannerRepository bannerRepository;
    private final ProductRepository productRepository;

    public BannerService(BannerRepository bannerRepository, ProductRepository productRepository) {
        this.bannerRepository = bannerRepository;
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public List<BannerDto> getActiveBanners() {
        return bannerRepository.findActiveBanners().stream()
                .map(this::convertToDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BannerDto> getAllAdmin() {
        return bannerRepository.findAllBanners().stream()
                .map(this::convertToDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public BannerDto getById(UUID id) {
        Banner banner = bannerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Banner não encontrado"));
        return convertToDto(banner);
    }

    @Transactional
    public BannerDto create(BannerDto dto) {
        Product product = productRepository.findById(dto.getProductId())
                .orElseThrow(() -> new RuntimeException("Produto vinculado ao banner não encontrado"));

        Banner banner = Banner.builder()
                .title(dto.getTitle().trim())
                .imagePath(dto.getImagePath().trim())
                .product(product)
                .displayOrder(dto.getDisplayOrder() != null ? dto.getDisplayOrder() : 0)
                .active(true)
                .build();

        Banner saved = bannerRepository.save(banner);
        return convertToDto(saved);
    }

    @Transactional
    public BannerDto update(UUID id, BannerDto dto) {
        Banner banner = bannerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Banner não encontrado"));

        Product product = productRepository.findById(dto.getProductId())
                .orElseThrow(() -> new RuntimeException("Produto vinculado ao banner não encontrado"));

        banner.setTitle(dto.getTitle().trim());
        banner.setImagePath(dto.getImagePath().trim());
        banner.setProduct(product);
        if (dto.getDisplayOrder() != null) {
            banner.setDisplayOrder(dto.getDisplayOrder());
        }
        if (dto.getActive() != null) {
            banner.setActive(dto.getActive());
        }

        Banner updated = bannerRepository.save(banner);
        return convertToDto(updated);
    }

    @Transactional
    public void logicalDelete(UUID id) {
        Banner banner = bannerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Banner não encontrado"));
        banner.setActive(false);
        bannerRepository.save(banner);
    }

    private BannerDto convertToDto(Banner banner) {
        return BannerDto.builder()
                .id(banner.getId())
                .title(banner.getTitle())
                .imagePath(banner.getImagePath())
                .productId(banner.getProduct().getId())
                .productName(banner.getProduct().getName())
                .displayOrder(banner.getDisplayOrder())
                .active(banner.isActive())
                .build();
    }
}
