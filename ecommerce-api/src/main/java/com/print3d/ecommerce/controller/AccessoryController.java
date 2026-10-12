package com.print3d.ecommerce.controller;

import com.print3d.ecommerce.dto.AccessoryDto;
import com.print3d.ecommerce.service.AccessoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/accessories")
@Tag(name = "Administração - Acessórios", description = "Endpoints de gerenciamento de acessórios (Acesso: Administrador ou Financeiro)")
@SecurityRequirement(name = "bearerAuth")
public class AccessoryController {

    private final AccessoryService accessoryService;

    public AccessoryController(AccessoryService accessoryService) {
        this.accessoryService = accessoryService;
    }

    @GetMapping
    @Operation(summary = "Lista e filtra os acessórios ativos")
    public ResponseEntity<List<AccessoryDto>> getAllActive(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "description") String sortBy,
            @RequestParam(defaultValue = "asc") String direction) {
        return ResponseEntity.ok(accessoryService.getAllActive(search, sortBy, direction));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Busca um acessório por ID")
    public ResponseEntity<AccessoryDto> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(accessoryService.getById(id));
    }

    @PostMapping
    @Operation(summary = "Cadastra um novo acessório no catálogo global")
    public ResponseEntity<AccessoryDto> create(@Valid @RequestBody AccessoryDto dto) {
        AccessoryDto created = accessoryService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualiza um acessório existente")
    public ResponseEntity<AccessoryDto> update(@PathVariable UUID id, @Valid @RequestBody AccessoryDto dto) {
        return ResponseEntity.ok(accessoryService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Desativa um acessório (Exclusão Lógica)")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        accessoryService.logicalDelete(id);
        return ResponseEntity.noContent().build();
    }
}
