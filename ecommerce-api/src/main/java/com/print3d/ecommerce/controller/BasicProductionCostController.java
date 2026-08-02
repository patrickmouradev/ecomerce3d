package com.print3d.ecommerce.controller;

import com.print3d.ecommerce.dto.BasicProductionCostDto;
import com.print3d.ecommerce.service.BasicProductionCostService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/basic-costs")
@Tag(name = "Administração - Custos Básicos de Produção", description = "Endpoints de configuração de custos básicos (Acesso: Administrador)")
@SecurityRequirement(name = "bearerAuth")
public class BasicProductionCostController {

    private final BasicProductionCostService basicProductionCostService;

    public BasicProductionCostController(BasicProductionCostService basicProductionCostService) {
        this.basicProductionCostService = basicProductionCostService;
    }

    @GetMapping
    @Operation(summary = "Lista e filtra os custos básicos de produção ativos")
    public ResponseEntity<List<BasicProductionCostDto>> getAllActive(
            @RequestParam(required = false) String description,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate createdDate,
            @RequestParam(defaultValue = "description") String sortBy,
            @RequestParam(defaultValue = "asc") String direction) {
        
        List<BasicProductionCostDto> costs = basicProductionCostService.getAllActive(description, createdDate, sortBy, direction);
        return ResponseEntity.ok(costs);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Busca um custo básico de produção por ID")
    public ResponseEntity<BasicProductionCostDto> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(basicProductionCostService.getById(id));
    }

    @PostMapping
    @Operation(summary = "Cadastra um novo custo básico de produção")
    public ResponseEntity<BasicProductionCostDto> create(@Valid @RequestBody BasicProductionCostDto dto) {
        BasicProductionCostDto created = basicProductionCostService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualiza um custo básico de produção existente")
    public ResponseEntity<BasicProductionCostDto> update(@PathVariable UUID id, @Valid @RequestBody BasicProductionCostDto dto) {
        return ResponseEntity.ok(basicProductionCostService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Exclusão lógica de um custo (inativa o registro)")
    public ResponseEntity<Void> logicalDelete(@PathVariable UUID id) {
        basicProductionCostService.logicalDelete(id);
        return ResponseEntity.noContent().build();
    }
}
