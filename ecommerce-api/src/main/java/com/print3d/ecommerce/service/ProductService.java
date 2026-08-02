package com.print3d.ecommerce.service;

import com.print3d.ecommerce.dto.PricingResult;
import com.print3d.ecommerce.dto.ProductDto;
import com.print3d.ecommerce.model.Filament;
import com.print3d.ecommerce.model.Product;
import com.print3d.ecommerce.repository.FilamentRepository;
import com.print3d.ecommerce.repository.ProductRepository;
import com.print3d.ecommerce.repository.SystemParameterRepository;
import com.print3d.ecommerce.util.DatePatterns;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final FilamentRepository filamentRepository;
    private final PricingCalculatorService pricingCalculatorService;

    @Value("${app.upload.dir}")
    private String uploadDir;

    public ProductService(ProductRepository productRepository,
                          FilamentRepository filamentRepository,
                          PricingCalculatorService pricingCalculatorService) {
        this.productRepository = productRepository;
        this.filamentRepository = filamentRepository;
        this.pricingCalculatorService = pricingCalculatorService;
    }

    @Transactional(readOnly = true)
    public List<ProductDto> getCatalog(String query, String sortBy, String direction) {
        Sort sort = buildSort(sortBy, direction);
        List<Product> products = productRepository.searchCatalog(
                query == null || query.trim().isEmpty() ? null : query.trim(),
                sort
        );
        return products.stream().map(this::convertToDto).toList();
    }

    @Transactional(readOnly = true)
    public List<ProductDto> getAllAdmin(String query, String sortBy, String direction) {
        Sort sort = buildSort(sortBy, direction);
        List<Product> products = productRepository.searchAll(
                query == null || query.trim().isEmpty() ? null : query.trim(),
                sort
        );
        return products.stream().map(this::convertToDto).toList();
    }

    @Transactional(readOnly = true)
    public ProductDto getById(UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produto não encontrado"));
        return convertToDto(product);
    }

    @Transactional
    public ProductDto create(ProductDto dto) {
        Filament filament = filamentRepository.findById(dto.getFilamentId())
                .orElseThrow(() -> new RuntimeException("Filamento não encontrado"));

        Product product = Product.builder()
                .name(dto.getName().trim())
                .description(dto.getDescription())
                .weightG(dto.getWeightG())
                .printingHours(dto.getPrintingHours())
                .filament(filament)
                .profitMargin(dto.getProfitMargin())
                .salePriceParticular(dto.getSalePriceParticular())
                .salePriceShoppe(dto.getSalePriceShoppe())
                .active(dto.getActive() != null ? dto.getActive() : true)
                .imagesVideosPaths(dto.getImagesVideosPaths() != null ? dto.getImagesVideosPaths() : new ArrayList<>())
                .build();

        Product saved = productRepository.save(product);
        return convertToDto(saved);
    }

    @Transactional
    public ProductDto update(UUID id, ProductDto dto) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produto não encontrado"));

        Filament filament = filamentRepository.findById(dto.getFilamentId())
                .orElseThrow(() -> new RuntimeException("Filamento não encontrado"));

        product.setName(dto.getName().trim());
        product.setDescription(dto.getDescription());
        product.setWeightG(dto.getWeightG());
        product.setPrintingHours(dto.getPrintingHours());
        product.setFilament(filament);
        product.setProfitMargin(dto.getProfitMargin());
        product.setSalePriceParticular(dto.getSalePriceParticular());
        product.setSalePriceShoppe(dto.getSalePriceShoppe());
        if (dto.getActive() != null) {
            product.setActive(dto.getActive());
        }
        if (dto.getImagesVideosPaths() != null) {
            product.setImagesVideosPaths(dto.getImagesVideosPaths());
        }

        Product updated = productRepository.save(product);
        return convertToDto(updated);
    }

    @Transactional
    public void logicalDelete(UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produto não encontrado"));
        product.setActive(false);
        productRepository.save(product);
    }

    /**
     * Calcula e retorna o preço sugerido, custo de produção e lucro líquido para o controlador antes de salvar (API auxiliar da calculadora)
     */
    @Transactional(readOnly = true)
    public PricingResult getPricingPreview(BigDecimal weightG, BigDecimal printingHours, UUID filamentId, BigDecimal profitMargin) {
        Filament filament = filamentRepository.findById(filamentId)
                .orElseThrow(() -> new RuntimeException("Filamento não encontrado"));
        Product product = Product.builder()
                .weightG(weightG)
                .printingHours(printingHours)
                .filament(filament)
                .profitMargin(profitMargin)
                .build();
        return pricingCalculatorService.calculatePricing(product);
    }

    /**
     * Armazena uma foto ou vídeo localmente e retorna o path de URL correspondente
     */
    public String saveUploadedFile(MultipartFile file) throws IOException {
        // Garante que o diretório existe
        File uploadFolder = new File(uploadDir, "products");
        if (!uploadFolder.exists()) {
            uploadFolder.mkdirs();
        }

        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        // Gera nome aleatório único para o arquivo
        String randomFilename = UUID.randomUUID().toString() + extension;
        Path destination = Paths.get(uploadFolder.getAbsolutePath(), randomFilename);

        Files.copy(file.getInputStream(), destination);

        // Retorna a URL relativa mapeada para a rota do recurso estático
        return "/uploads/products/" + randomFilename;
    }

    private Sort buildSort(String sortBy, String direction) {
        Sort.Direction dir = direction.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        // Tratamento especial para maior/menor valor
        if (sortBy.equalsIgnoreCase("price")) {
            return Sort.by(dir, "salePriceParticular");
        }
        // Data adicionada (Newest/Oldest)
        if (sortBy.equalsIgnoreCase("date")) {
            return Sort.by(dir, "createdAt");
        }
        return Sort.by(dir, sortBy);
    }

    private ProductDto convertToDto(Product product) {
        String filamentLabel = String.format("%s - %s (%s)",
                product.getFilament().getMaterial(),
                product.getFilament().getBrand(),
                product.getFilament().getColor()
        );

        com.print3d.ecommerce.dto.PricingResult pricing = pricingCalculatorService.calculatePricing(product);

        return ProductDto.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .weightG(product.getWeightG())
                .printingHours(product.getPrintingHours())
                .filamentId(product.getFilament().getId())
                .filamentLabel(filamentLabel)
                .productionCost(pricing.getProductionCost())
                .suggestedPrice(pricing.getSuggestedPrice())
                .suggestedPriceShoppe(pricing.getSuggestedPriceShoppe())
                .suggestedPriceParticular(pricing.getSuggestedPriceParticular())
                .netProfit(pricing.getNetProfit())
                .netProfitShoppe(pricing.getNetProfitShoppe())
                .energyCostTotal(pricing.getEnergyCostTotal())
                .printerWearTotal(pricing.getPrinterWearTotal())
                .packagingCost(pricing.getPackagingCost())
                .shopeeCostsTotal(pricing.getShopeeCostsTotal())
                .productionCostWithoutShoppe(pricing.getProductionCostWithoutShoppe())
                .profitMargin(product.getProfitMargin())
                .salePriceParticular(product.getSalePriceParticular())
                .salePriceShoppe(product.getSalePriceShoppe())
                .active(product.isActive())
                .imagesVideosPaths(product.getImagesVideosPaths())
                .createdAt(product.getCreatedAt() != null ? product.getCreatedAt().format(DatePatterns.DATE_TIME_FORMATTER) : null)
                .updatedAt(product.getUpdatedAt() != null ? product.getUpdatedAt().format(DatePatterns.DATE_TIME_FORMATTER) : null)
                .build();
    }
}
