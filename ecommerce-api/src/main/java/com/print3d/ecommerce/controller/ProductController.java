package com.print3d.ecommerce.controller;

import com.print3d.ecommerce.dto.ProductDto;
import com.print3d.ecommerce.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@Tag(name = "Catálogo e Administração de Produtos", description = "Endpoints públicos do catálogo de produtos e endpoints administrativos de gerenciamento")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    /* =========================================================================
       ROTAS PÚBLICAS (Catálogo)
       ========================================================================= */

    @GetMapping("/api/products")
    @Operation(summary = "Lista produtos ativos no catálogo público com filtros e ordenação")
    public ResponseEntity<List<ProductDto>> getCatalog(
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String direction) {
        
        List<ProductDto> catalog = productService.getCatalog(query, sortBy, direction);
        return ResponseEntity.ok(catalog);
    }

    @GetMapping("/api/products/{id}")
    @Operation(summary = "Busca detalhes de um produto público por ID")
    public ResponseEntity<ProductDto> getProductDetail(@PathVariable UUID id) {
        return ResponseEntity.ok(productService.getById(id));
    }

    /* =========================================================================
       ROTAS ADMINISTRATIVAS
       ========================================================================= */

    @GetMapping("/api/admin/products")
    @Operation(summary = "Lista todos os produtos (incluindo inativos) no painel administrativo")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<List<ProductDto>> getAllAdmin(
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String direction) {
        
        List<ProductDto> products = productService.getAllAdmin(query, sortBy, direction);
        return ResponseEntity.ok(products);
    }

    @PostMapping("/api/admin/products")
    @Operation(summary = "Cadastra um novo produto")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ProductDto> create(@Valid @RequestBody ProductDto dto) {
        ProductDto created = productService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/api/admin/products/{id}")
    @Operation(summary = "Atualiza dados de um produto existente")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ProductDto> update(@PathVariable UUID id, @Valid @RequestBody ProductDto dto) {
        return ResponseEntity.ok(productService.update(id, dto));
    }

    @DeleteMapping("/api/admin/products/{id}")
    @Operation(summary = "Exclusão lógica de um produto (inativa o registro)")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<Void> logicalDelete(@PathVariable UUID id) {
        productService.logicalDelete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/admin/products/pricing-preview")
    @Operation(summary = "Calcula em tempo real os custos, sugestão de preço e lucro líquido baseados em peso, horas, filamento e margem de lucro")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<com.print3d.ecommerce.dto.PricingResult> getPricingPreview(
            @RequestParam BigDecimal weightG,
            @RequestParam BigDecimal printingHours,
            @RequestParam UUID filamentId,
            @RequestParam BigDecimal profitMargin) {
        
        com.print3d.ecommerce.dto.PricingResult result = productService.getPricingPreview(
                weightG, printingHours, filamentId, profitMargin
        );
        return ResponseEntity.ok(result);
    }

    @PostMapping(value = "/api/admin/products/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Faz upload de imagens ou vídeos para o produto")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<Map<String, String>> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            String fileUrl = productService.saveUploadedFile(file);
            return ResponseEntity.ok(Collections.singletonMap("fileUrl", fileUrl));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "Erro ao fazer upload do arquivo: " + e.getMessage()));
        }
    }
}
