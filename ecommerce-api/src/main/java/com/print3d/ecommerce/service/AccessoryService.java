package com.print3d.ecommerce.service;

import com.print3d.ecommerce.dto.AccessoryDto;
import com.print3d.ecommerce.model.Accessory;
import com.print3d.ecommerce.repository.AccessoryRepository;
import com.print3d.ecommerce.util.DatePatterns;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class AccessoryService {

    private final AccessoryRepository accessoryRepository;

    public AccessoryService(AccessoryRepository accessoryRepository) {
        this.accessoryRepository = accessoryRepository;
    }

    @Transactional(readOnly = true)
    public List<AccessoryDto> getAllActive(String search, String sortBy, String direction) {
        String sortField = (sortBy == null || sortBy.isBlank()) ? "description" : sortBy;
        Sort.Direction dir = "desc".equalsIgnoreCase(direction) ? Sort.Direction.DESC : Sort.Direction.ASC;
        Sort sort = Sort.by(dir, sortField);

        List<Accessory> accessories = accessoryRepository.searchActiveAccessories(
                search == null || search.trim().isEmpty() ? null : search.trim(),
                sort
        );

        return accessories.stream().map(this::convertToDto).toList();
    }

    @Transactional(readOnly = true)
    public AccessoryDto getById(UUID id) {
        Accessory accessory = accessoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Acessório não encontrado"));
        return convertToDto(accessory);
    }

    @Transactional
    public AccessoryDto create(AccessoryDto dto) {
        Accessory accessory = Accessory.builder()
                .description(dto.getDescription().trim())
                .price(dto.getPrice())
                .active(true)
                .build();

        Accessory saved = accessoryRepository.save(accessory);
        return convertToDto(saved);
    }

    @Transactional
    public AccessoryDto update(UUID id, AccessoryDto dto) {
        Accessory accessory = accessoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Acessório não encontrado"));

        accessory.setDescription(dto.getDescription().trim());
        accessory.setPrice(dto.getPrice());
        if (dto.getActive() != null) {
            accessory.setActive(dto.getActive());
        }

        Accessory updated = accessoryRepository.save(accessory);
        return convertToDto(updated);
    }

    @Transactional
    public void logicalDelete(UUID id) {
        Accessory accessory = accessoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Acessório não encontrado"));
        accessory.setActive(false);
        accessoryRepository.save(accessory);
    }

    public AccessoryDto convertToDto(Accessory accessory) {
        return AccessoryDto.builder()
                .id(accessory.getId())
                .description(accessory.getDescription())
                .price(accessory.getPrice())
                .active(accessory.isActive())
                .createdAt(accessory.getCreatedAt() != null ? accessory.getCreatedAt().format(DatePatterns.DATE_TIME_FORMATTER) : null)
                .updatedAt(accessory.getUpdatedAt() != null ? accessory.getUpdatedAt().format(DatePatterns.DATE_TIME_FORMATTER) : null)
                .build();
    }
}
