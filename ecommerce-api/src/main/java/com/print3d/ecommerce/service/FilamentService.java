package com.print3d.ecommerce.service;

import com.print3d.ecommerce.dto.FilamentDto;
import com.print3d.ecommerce.model.Filament;
import com.print3d.ecommerce.repository.FilamentRepository;
import com.print3d.ecommerce.util.DatePatterns;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class FilamentService {

    private final FilamentRepository filamentRepository;

    public FilamentService(FilamentRepository filamentRepository) {
        this.filamentRepository = filamentRepository;
    }

    @Transactional(readOnly = true)
    public List<FilamentDto> getAllActive(String material, String brand, String color, String sortBy, String direction) {
        Sort sort = Sort.by(Sort.Direction.fromString(direction.equalsIgnoreCase("desc") ? "DESC" : "ASC"), sortBy);
        
        List<Filament> filaments = filamentRepository.searchActiveFilaments(
                material == null || material.trim().isEmpty() ? null : material.trim(),
                brand == null || brand.trim().isEmpty() ? null : brand.trim(),
                color == null || color.trim().isEmpty() ? null : color.trim(),
                sort
        );

        return filaments.stream().map(this::convertToDto).toList();
    }

    @Transactional(readOnly = true)
    public FilamentDto getById(UUID id) {
        Filament filament = filamentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Filamento não encontrado"));
        return convertToDto(filament);
    }

    @Transactional
    public FilamentDto create(FilamentDto dto) {
        Filament filament = Filament.builder()
                .material(dto.getMaterial().trim())
                .brand(dto.getBrand().trim())
                .color(dto.getColor().trim())
                .pricePerKg(dto.getPricePerKg())
                .quantityKg(dto.getQuantityKg())
                .active(true)
                .build();

        Filament saved = filamentRepository.save(filament);
        return convertToDto(saved);
    }

    @Transactional
    public FilamentDto update(UUID id, FilamentDto dto) {
        Filament filament = filamentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Filamento não encontrado"));

        filament.setMaterial(dto.getMaterial().trim());
        filament.setBrand(dto.getBrand().trim());
        filament.setColor(dto.getColor().trim());
        filament.setPricePerKg(dto.getPricePerKg());
        filament.setQuantityKg(dto.getQuantityKg());
        if (dto.getActive() != null) {
            filament.setActive(dto.getActive());
        }

        Filament updated = filamentRepository.save(filament);
        return convertToDto(updated);
    }

    @Transactional
    public void logicalDelete(UUID id) {
        Filament filament = filamentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Filamento não encontrado"));
        
        filament.setActive(false);
        filamentRepository.save(filament);
    }

    private FilamentDto convertToDto(Filament filament) {
        return FilamentDto.builder()
                .id(filament.getId())
                .material(filament.getMaterial())
                .brand(filament.getBrand())
                .color(filament.getColor())
                .pricePerKg(filament.getPricePerKg())
                .quantityKg(filament.getQuantityKg())
                .active(filament.isActive())
                .createdAt(filament.getCreatedAt() != null ? filament.getCreatedAt().format(DatePatterns.DATE_TIME_FORMATTER) : null)
                .updatedAt(filament.getUpdatedAt() != null ? filament.getUpdatedAt().format(DatePatterns.DATE_TIME_FORMATTER) : null)
                .build();
    }
}
