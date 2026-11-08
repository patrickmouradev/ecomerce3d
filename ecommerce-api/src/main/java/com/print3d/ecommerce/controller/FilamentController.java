package com.print3d.ecommerce.controller;

import com.print3d.ecommerce.dto.FilamentDto;
import com.print3d.ecommerce.service.FilamentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.Map;
import java.math.BigDecimal;

@RestController
@RequestMapping("/api/admin/filaments")
@Tag(name = "Administração - Filamentos", description = "Endpoints de gerenciamento do estoque de filamentos (Acesso: Administrador ou Financeiro)")
@SecurityRequirement(name = "bearerAuth")
public class FilamentController {

    private final FilamentService filamentService;

    public FilamentController(FilamentService filamentService) {
        this.filamentService = filamentService;
    }

    @GetMapping
    @Operation(summary = "Lista e filtra os filamentos cadastrados ativos")
    public ResponseEntity<List<FilamentDto>> getAllActive(
            @RequestParam(required = false) String material,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String color,
            @RequestParam(defaultValue = "material") String sortBy,
            @RequestParam(defaultValue = "asc") String direction) {
        
        List<FilamentDto> filaments = filamentService.getAllActive(material, brand, color, sortBy, direction);
        return ResponseEntity.ok(filaments);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Busca um filamento por ID")
    public ResponseEntity<FilamentDto> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(filamentService.getById(id));
    }

    @PostMapping
    @Operation(summary = "Cadastra um novo filamento")
    public ResponseEntity<FilamentDto> create(@Valid @RequestBody FilamentDto dto) {
        FilamentDto created = filamentService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualiza um filamento existente")
    public ResponseEntity<FilamentDto> update(@PathVariable UUID id, @Valid @RequestBody FilamentDto dto) {
        return ResponseEntity.ok(filamentService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Exclusão lógica de um filamento (inativa o registro)")
    public ResponseEntity<Void> logicalDelete(@PathVariable UUID id) {
        filamentService.logicalDelete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/baixa")
    @Operation(summary = "Dá baixa manual no estoque do filamento informando a quantidade consumida em gramas")
    public ResponseEntity<FilamentDto> deductQuantity(
            @PathVariable UUID id,
            @RequestBody Map<String, BigDecimal> payload) {
        BigDecimal quantityG = payload.get("quantityG");
        if (quantityG == null) {
            quantityG = payload.get("quantity");
        }
        return ResponseEntity.ok(filamentService.deductQuantity(id, quantityG));
    }

}
