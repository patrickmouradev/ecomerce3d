package com.print3d.ecommerce.service;

import com.print3d.ecommerce.dto.BasicProductionCostDto;
import com.print3d.ecommerce.model.BasicProductionCost;
import com.print3d.ecommerce.model.User;
import com.print3d.ecommerce.repository.BasicProductionCostRepository;
import com.print3d.ecommerce.repository.UserRepository;
import com.print3d.ecommerce.util.CalculationUtils;
import com.print3d.ecommerce.util.DatePatterns;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class BasicProductionCostService {

    private final BasicProductionCostRepository basicProductionCostRepository;
    private final UserRepository userRepository;

    public BasicProductionCostService(BasicProductionCostRepository basicProductionCostRepository, UserRepository userRepository) {
        this.basicProductionCostRepository = basicProductionCostRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<BasicProductionCostDto> getAllActive(String description, LocalDate createdDate, String sortBy, String direction) {
        Sort sort = Sort.by(Sort.Direction.fromString(direction.equalsIgnoreCase("desc") ? "DESC" : "ASC"), sortBy);

        LocalDate startDate = null;
        LocalDate endDate = null;
        
        if (createdDate != null) {
            startDate = createdDate;
            endDate = createdDate;
        }

        List<BasicProductionCost> costs = basicProductionCostRepository.searchActiveCosts(
                description == null || description.trim().isEmpty() ? null : description.trim(),
                startDate,
                endDate,
                sort
        );

        return costs.stream().map(this::convertToDto).toList();
    }

    @Transactional(readOnly = true)
    public BasicProductionCostDto getById(UUID id) {
        BasicProductionCost cost = basicProductionCostRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Custo de produção básico não encontrado"));
        return convertToDto(cost);
    }

    @Transactional
    public BasicProductionCostDto create(BasicProductionCostDto dto) {
        boolean isPct = Boolean.TRUE.equals(dto.getIsPercentage());
        var existingOpt = basicProductionCostRepository.findByDescription(dto.getDescription().trim());
        if (existingOpt.isPresent()) {
            BasicProductionCost existing = existingOpt.get();
            if (existing.isActive()) {
                throw new RuntimeException("Já existe um custo com esta descrição");
            } else {
                existing.setActive(true);
                existing.setValue(dto.getValue());
                existing.setPercentage(isPct);
                existing.setUpdatedBy(getCurrentAuditorName());
                return convertToDto(basicProductionCostRepository.save(existing));
            }
        }

        BasicProductionCost cost = BasicProductionCost.builder()
                .description(dto.getDescription().trim())
                .value(dto.getValue())
                .isPercentage(isPct)
                .createdBy(getCurrentAuditorName())
                .updatedBy(getCurrentAuditorName())
                .active(true)
                .build();

        BasicProductionCost saved = basicProductionCostRepository.save(cost);
        return convertToDto(saved);
    }

    @Transactional
    public BasicProductionCostDto update(UUID id, BasicProductionCostDto dto) {
        BasicProductionCost cost = basicProductionCostRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Custo de produção básico não encontrado"));

        cost.setValue(dto.getValue());
        if (dto.getIsPercentage() != null) {
            cost.setPercentage(dto.getIsPercentage());
        }
        cost.setUpdatedBy(getCurrentAuditorName());
        if (dto.getActive() != null) {
            cost.setActive(dto.getActive());
        }

        BasicProductionCost updated = basicProductionCostRepository.save(cost);
        return convertToDto(updated);
    }

    @Transactional
    public void logicalDelete(UUID id) {
        BasicProductionCost cost = basicProductionCostRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Custo de produção básico não encontrado"));
        
        cost.setActive(false);
        cost.setUpdatedBy(getCurrentAuditorName());
        basicProductionCostRepository.save(cost);
    }

    private String getCurrentAuditorName() {
        try {
            var authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getPrincipal())) {
                String userIdStr = (String) authentication.getPrincipal();
                return userRepository.findById(UUID.fromString(userIdStr))
                        .map(User::getName)
                        .orElse("SYSTEM");
            }
        } catch (Exception e) {
            // Ignore
        }
        return "SYSTEM";
    }

    private BasicProductionCostDto convertToDto(BasicProductionCost cost) {
        String formattedValue = null;
        if (cost.getValue() != null) {
            if (cost.isPercentage()) {
                formattedValue = String.format(java.util.Locale.forLanguageTag("pt-BR"), "%.2f%%", cost.getValue());
            } else {
                formattedValue = CalculationUtils.formatCurrency(new BigDecimal(cost.getValue().toString()));
            }
        }

        return BasicProductionCostDto.builder()
                .id(cost.getId())
                .description(cost.getDescription())
                .value(cost.getValue())
                .isPercentage(cost.isPercentage())
                .formattedValue(formattedValue)
                .createdBy(cost.getCreatedBy())
                .updatedBy(cost.getUpdatedBy())
                .createdAt(cost.getCreatedAt() != null ? cost.getCreatedAt().format(DatePatterns.DATE_FORMATTER) : null)
                .updatedAt(cost.getUpdatedAt() != null ? cost.getUpdatedAt().format(DatePatterns.DATE_FORMATTER) : null)
                .active(cost.isActive())
                .build();
    }
}
