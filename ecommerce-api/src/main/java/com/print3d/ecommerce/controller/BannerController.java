package com.print3d.ecommerce.controller;

import com.print3d.ecommerce.dto.BannerDto;
import com.print3d.ecommerce.service.BannerService;
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
@Tag(name = "Destaques e Banners", description = "Endpoints de visualização de banners públicos e administração dos destaques")
public class BannerController {

    private final BannerService bannerService;

    public BannerController(BannerService bannerService) {
        this.bannerService = bannerService;
    }

    /* =========================================================================
       ROTAS PÚBLICAS
       ========================================================================= */

    @GetMapping("/api/banners")
    @Operation(summary = "Lista todos os banners ativos para exibição no carrossel inicial")
    public ResponseEntity<List<BannerDto>> getActiveBanners() {
        return ResponseEntity.ok(bannerService.getActiveBanners());
    }

    /* =========================================================================
       ROTAS ADMINISTRATIVAS
       ========================================================================= */

    @GetMapping("/api/admin/banners")
    @Operation(summary = "Lista todos os banners no painel administrativo")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<List<BannerDto>> getAllAdmin() {
        return ResponseEntity.ok(bannerService.getAllAdmin());
    }

    @GetMapping("/api/admin/banners/{id}")
    @Operation(summary = "Busca um banner específico por ID")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<BannerDto> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(bannerService.getById(id));
    }

    @PostMapping("/api/admin/banners")
    @Operation(summary = "Cadastra um novo banner vinculado a um produto")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<BannerDto> create(@Valid @RequestBody BannerDto dto) {
        BannerDto created = bannerService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/api/admin/banners/{id}")
    @Operation(summary = "Atualiza dados de um banner")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<BannerDto> update(@PathVariable UUID id, @Valid @RequestBody BannerDto dto) {
        return ResponseEntity.ok(bannerService.update(id, dto));
    }

    @DeleteMapping("/api/admin/banners/{id}")
    @Operation(summary = "Exclusão lógica de um banner (inativa o registro)")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<Void> logicalDelete(@PathVariable UUID id) {
        bannerService.logicalDelete(id);
        return ResponseEntity.noContent().build();
    }
}
