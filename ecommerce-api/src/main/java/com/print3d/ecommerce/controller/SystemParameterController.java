package com.print3d.ecommerce.controller;

import com.print3d.ecommerce.dto.SystemParameterDto;
import com.print3d.ecommerce.service.SystemParameterService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/parameters")
@Tag(name = "Administração - Parâmetros de Sistema", description = "Endpoints de configuração de parâmetros gerais do sistema (Acesso: Administrador ou Financeiro)")
@SecurityRequirement(name = "bearerAuth")
public class SystemParameterController {

    private final SystemParameterService systemParameterService;

    public SystemParameterController(SystemParameterService systemParameterService) {
        this.systemParameterService = systemParameterService;
    }

    @GetMapping
    @Operation(summary = "Lista e filtra os parâmetros do sistema ativos")
    public ResponseEntity<List<SystemParameterDto>> getAllActive(
            @RequestParam(required = false) String description,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate createdDate,
            @RequestParam(defaultValue = "description") String sortBy,
            @RequestParam(defaultValue = "asc") String direction) {
        
        List<SystemParameterDto> parameters = systemParameterService.getAllActive(description, createdDate, sortBy, direction);
        return ResponseEntity.ok(parameters);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Busca um parâmetro do sistema por ID")
    public ResponseEntity<SystemParameterDto> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(systemParameterService.getById(id));
    }

    @PostMapping
    @Operation(summary = "Cadastra um novo parâmetro do sistema")
    public ResponseEntity<SystemParameterDto> create(@Valid @RequestBody SystemParameterDto dto) {
        SystemParameterDto created = systemParameterService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualiza um parâmetro do sistema existente")
    public ResponseEntity<SystemParameterDto> update(@PathVariable UUID id, @Valid @RequestBody SystemParameterDto dto) {
        return ResponseEntity.ok(systemParameterService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Exclusão lógica de um parâmetro (inativa o registro)")
    public ResponseEntity<Void> logicalDelete(@PathVariable UUID id) {
        systemParameterService.logicalDelete(id);
        return ResponseEntity.noContent().build();
    }
}
