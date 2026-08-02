package com.print3d.ecommerce.service;

import com.print3d.ecommerce.dto.SystemParameterDto;
import com.print3d.ecommerce.model.SystemParameter;
import com.print3d.ecommerce.model.User;
import com.print3d.ecommerce.repository.SystemParameterRepository;
import com.print3d.ecommerce.repository.UserRepository;
import com.print3d.ecommerce.util.CalculationUtils;
import com.print3d.ecommerce.util.DatePatterns;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Service
public class SystemParameterService {

    private final SystemParameterRepository systemParameterRepository;
    private final UserRepository userRepository;

    public SystemParameterService(SystemParameterRepository systemParameterRepository, UserRepository userRepository) {
        this.systemParameterRepository = systemParameterRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<SystemParameterDto> getAllActive(String description, LocalDate createdDate, String sortBy, String direction) {
        Sort sort = Sort.by(Sort.Direction.fromString(direction.equalsIgnoreCase("desc") ? "DESC" : "ASC"), sortBy);

        LocalDateTime startDate = null;
        LocalDateTime endDate = null;
        
        if (createdDate != null) {
            startDate = createdDate.atStartOfDay();
            endDate = createdDate.atTime(LocalTime.MAX);
        }

        List<SystemParameter> parameters = systemParameterRepository.searchActiveParameters(
                description == null || description.trim().isEmpty() ? null : description.trim(),
                startDate,
                endDate,
                sort
        );

        return parameters.stream().map(this::convertToDto).toList();
    }

    @Transactional(readOnly = true)
    public SystemParameterDto getById(UUID id) {
        SystemParameter parameter = systemParameterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Parâmetro não encontrado"));
        return convertToDto(parameter);
    }

    @Transactional
    public SystemParameterDto create(SystemParameterDto dto) {
        // Verifica se a descrição já existe para evitar duplicidades
        systemParameterRepository.findByDescription(dto.getDescription().trim())
                .ifPresent(p -> {
                    if (p.isActive()) {
                        throw new RuntimeException("Já existe um parâmetro com esta descrição");
                    } else {
                        // Se existia mas estava inativo, reativa
                        p.setActive(true);
                        p.setParamValue(dto.getParamValue().trim());
                        p.setUpdatedBy(getCurrentAuditorName());
                        systemParameterRepository.save(p);
                    }
                });

        SystemParameter parameter = SystemParameter.builder()
                .description(dto.getDescription().trim())
                .paramValue(dto.getParamValue().trim())
                .createdBy(getCurrentAuditorName())
                .updatedBy(getCurrentAuditorName())
                .active(true)
                .build();

        SystemParameter saved = systemParameterRepository.save(parameter);
        return convertToDto(saved);
    }

    @Transactional
    public SystemParameterDto update(UUID id, SystemParameterDto dto) {
        SystemParameter parameter = systemParameterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Parâmetro não encontrado"));

        parameter.setParamValue(dto.getParamValue().trim());
        parameter.setUpdatedBy(getCurrentAuditorName());
        if (dto.getActive() != null) {
            parameter.setActive(dto.getActive());
        }

        SystemParameter updated = systemParameterRepository.save(parameter);
        return convertToDto(updated);
    }

    @Transactional
    public void logicalDelete(UUID id) {
        SystemParameter parameter = systemParameterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Parâmetro não encontrado"));
        
        parameter.setActive(false);
        parameter.setUpdatedBy(getCurrentAuditorName());
        systemParameterRepository.save(parameter);
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

    private SystemParameterDto convertToDto(SystemParameter parameter) {
        String rawValue = parameter.getParamValue();
        String formattedValue = rawValue;

        // Se for um valor numérico válido, formata como R$ 1.000,25 para exibição
        try {
            BigDecimal numericValue = new BigDecimal(rawValue);
            formattedValue = CalculationUtils.formatCurrency(numericValue);
        } catch (NumberFormatException e) {
            // Não é um número simples (ex: URLs do CORS), mantém o valor bruto
        }

        return SystemParameterDto.builder()
                .id(parameter.getId())
                .description(parameter.getDescription())
                .paramValue(rawValue)
                .formattedValue(formattedValue)
                .createdBy(parameter.getCreatedBy())
                .updatedBy(parameter.getUpdatedBy())
                .createdAt(parameter.getCreatedAt() != null ? parameter.getCreatedAt().format(DatePatterns.DATE_FORMATTER) : null)
                .updatedAt(parameter.getUpdatedAt() != null ? parameter.getUpdatedAt().format(DatePatterns.DATE_FORMATTER) : null)
                .active(parameter.isActive())
                .build();
    }
}
