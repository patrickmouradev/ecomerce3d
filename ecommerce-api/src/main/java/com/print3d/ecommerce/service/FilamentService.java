package com.print3d.ecommerce.service;

import com.print3d.ecommerce.dto.FilamentBaixaDto;
import com.print3d.ecommerce.dto.FilamentDto;
import com.print3d.ecommerce.model.Filament;
import com.print3d.ecommerce.model.FilamentBaixa;
import com.print3d.ecommerce.repository.FilamentBaixaRepository;
import com.print3d.ecommerce.repository.FilamentRepository;
import com.print3d.ecommerce.util.DatePatterns;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

@Service
public class FilamentService {

    private final FilamentRepository filamentRepository;
    private final FilamentBaixaRepository filamentBaixaRepository;

    public FilamentService(FilamentRepository filamentRepository,
                           FilamentBaixaRepository filamentBaixaRepository) {
        this.filamentRepository = filamentRepository;
        this.filamentBaixaRepository = filamentBaixaRepository;
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

    @Transactional(readOnly = true)
    public List<FilamentBaixaDto> getAllBaixas(String search) {
        Sort sort = Sort.by(Sort.Direction.DESC, "createdAt");
        String term = (search == null || search.trim().isEmpty()) ? null : search.trim();
        List<FilamentBaixa> baixas = filamentBaixaRepository.searchBaixas(term, sort);
        return baixas.stream().map(this::convertToBaixaDto).toList();
    }

    @Transactional
    public FilamentBaixaDto createBaixa(FilamentBaixaDto dto) {
        if (dto.getQuantityG() == null || dto.getQuantityG().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("A quantidade consumida deve ser maior que zero.");
        }

        Filament filament = filamentRepository.findById(dto.getFilamentId())
                .orElseThrow(() -> new RuntimeException("Filamento não encontrado"));

        BigDecimal quantityKgToDeduct = dto.getQuantityG().divide(BigDecimal.valueOf(1000), 3, RoundingMode.HALF_UP);
        BigDecimal currentKg = filament.getQuantityKg() != null ? filament.getQuantityKg() : BigDecimal.ZERO;

        if (currentKg.compareTo(quantityKgToDeduct) < 0) {
            BigDecimal currentG = currentKg.multiply(BigDecimal.valueOf(1000));
            throw new IllegalArgumentException(String.format(
                    "Estoque insuficiente. Saldo disponível: %.1fg (%.3f kg), solicitado: %.1fg (%.3f kg)",
                    currentG, currentKg, dto.getQuantityG(), quantityKgToDeduct
            ));
        }

        filament.setQuantityKg(currentKg.subtract(quantityKgToDeduct));
        filamentRepository.save(filament);

        FilamentBaixa baixa = FilamentBaixa.builder()
                .filament(filament)
                .quantityG(dto.getQuantityG())
                .reason(dto.getReason() != null ? dto.getReason().trim() : null)
                .build();

        FilamentBaixa saved = filamentBaixaRepository.save(baixa);
        return convertToBaixaDto(saved);
    }

    @Transactional
    public FilamentBaixaDto updateBaixa(UUID id, FilamentBaixaDto dto) {
        if (dto.getQuantityG() == null || dto.getQuantityG().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("A quantidade consumida deve ser maior que zero.");
        }

        FilamentBaixa existingBaixa = filamentBaixaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Baixa de filamento não encontrada"));

        Filament oldFilament = existingBaixa.getFilament();
        BigDecimal oldQuantityG = existingBaixa.getQuantityG();
        BigDecimal newQuantityG = dto.getQuantityG();
        UUID newFilamentId = dto.getFilamentId() != null ? dto.getFilamentId() : oldFilament.getId();

        if (oldFilament.getId().equals(newFilamentId)) {
            // Mesmo filamento: ajustar a diferença no estoque
            BigDecimal diffG = newQuantityG.subtract(oldQuantityG);
            BigDecimal diffKg = diffG.divide(BigDecimal.valueOf(1000), 3, RoundingMode.HALF_UP);

            BigDecimal currentKg = oldFilament.getQuantityKg() != null ? oldFilament.getQuantityKg() : BigDecimal.ZERO;
            if (diffKg.compareTo(BigDecimal.ZERO) > 0 && currentKg.compareTo(diffKg) < 0) {
                BigDecimal currentG = currentKg.multiply(BigDecimal.valueOf(1000));
                throw new IllegalArgumentException(String.format(
                        "Estoque insuficiente para o acréscimo da baixa. Saldo atual: %.1fg, acréscimo necessário: %.1fg",
                        currentG, diffG
                ));
            }

            oldFilament.setQuantityKg(currentKg.subtract(diffKg));
            filamentRepository.save(oldFilament);
        } else {
            // Filamento alterado: devolver saldo ao antigo e abater do novo
            BigDecimal oldKg = oldQuantityG.divide(BigDecimal.valueOf(1000), 3, RoundingMode.HALF_UP);
            BigDecimal oldCurrentKg = oldFilament.getQuantityKg() != null ? oldFilament.getQuantityKg() : BigDecimal.ZERO;
            oldFilament.setQuantityKg(oldCurrentKg.add(oldKg));
            filamentRepository.save(oldFilament);

            Filament newFilament = filamentRepository.findById(newFilamentId)
                    .orElseThrow(() -> new RuntimeException("Novo filamento não encontrado"));

            BigDecimal newKg = newQuantityG.divide(BigDecimal.valueOf(1000), 3, RoundingMode.HALF_UP);
            BigDecimal newCurrentKg = newFilament.getQuantityKg() != null ? newFilament.getQuantityKg() : BigDecimal.ZERO;

            if (newCurrentKg.compareTo(newKg) < 0) {
                BigDecimal currentG = newCurrentKg.multiply(BigDecimal.valueOf(1000));
                throw new IllegalArgumentException(String.format(
                        "Estoque insuficiente no novo filamento. Saldo disponível: %.1fg, solicitado: %.1fg",
                        currentG, newQuantityG
                ));
            }

            newFilament.setQuantityKg(newCurrentKg.subtract(newKg));
            filamentRepository.save(newFilament);
            existingBaixa.setFilament(newFilament);
        }

        existingBaixa.setQuantityG(newQuantityG);
        existingBaixa.setReason(dto.getReason() != null ? dto.getReason().trim() : null);

        FilamentBaixa updated = filamentBaixaRepository.save(existingBaixa);
        return convertToBaixaDto(updated);
    }

    @Transactional
    public void deleteBaixa(UUID id) {
        FilamentBaixa existingBaixa = filamentBaixaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Baixa de filamento não encontrada"));

        Filament filament = existingBaixa.getFilament();
        BigDecimal quantityKgToReturn = existingBaixa.getQuantityG().divide(BigDecimal.valueOf(1000), 3, RoundingMode.HALF_UP);
        BigDecimal currentKg = filament.getQuantityKg() != null ? filament.getQuantityKg() : BigDecimal.ZERO;

        filament.setQuantityKg(currentKg.add(quantityKgToReturn));
        filamentRepository.save(filament);

        filamentBaixaRepository.delete(existingBaixa);
    }

    @Transactional
    public FilamentDto deductQuantity(UUID id, BigDecimal quantityG) {
        FilamentBaixaDto dto = FilamentBaixaDto.builder()
                .filamentId(id)
                .quantityG(quantityG)
                .reason("Baixa manual")
                .build();
        createBaixa(dto);

        Filament filament = filamentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Filamento não encontrado"));
        return convertToDto(filament);
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

    private FilamentBaixaDto convertToBaixaDto(FilamentBaixa baixa) {
        Filament f = baixa.getFilament();
        return FilamentBaixaDto.builder()
                .id(baixa.getId())
                .filamentId(f != null ? f.getId() : null)
                .filamentMaterial(f != null ? f.getMaterial() : null)
                .filamentBrand(f != null ? f.getBrand() : null)
                .filamentColor(f != null ? f.getColor() : null)
                .quantityG(baixa.getQuantityG())
                .reason(baixa.getReason())
                .createdAt(baixa.getCreatedAt() != null ? baixa.getCreatedAt().format(DatePatterns.DATE_TIME_FORMATTER) : null)
                .updatedAt(baixa.getUpdatedAt() != null ? baixa.getUpdatedAt().format(DatePatterns.DATE_TIME_FORMATTER) : null)
                .build();
    }

}
