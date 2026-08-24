package com.print3d.ecommerce.service;

import com.print3d.ecommerce.dto.PricingResult;
import com.print3d.ecommerce.dto.ProductDto;
import com.print3d.ecommerce.dto.ProductFilamentDto;
import com.print3d.ecommerce.model.Filament;
import com.print3d.ecommerce.model.Product;
import com.print3d.ecommerce.model.ProductFilament;
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
        Product product = Product.builder()
                .name(dto.getName().trim())
                .description(dto.getDescription())
                .printingHours(dto.getPrintingHours())
                .profitMargin(dto.getProfitMargin())
                .salePriceParticular(dto.getSalePriceParticular())
                .salePriceShoppe(dto.getSalePriceShoppe())
                .active(dto.getActive() != null ? dto.getActive() : true)
                .imagesVideosPaths(dto.getImagesVideosPaths() != null ? dto.getImagesVideosPaths() : new ArrayList<>())
                .build();

        if (dto.getFilaments() != null) {
            List<ProductFilament> pfList = new ArrayList<>();
            for (com.print3d.ecommerce.dto.ProductFilamentDto pfDto : dto.getFilaments()) {
                Filament filament = filamentRepository.findById(pfDto.getFilamentId())
                        .orElseThrow(() -> new RuntimeException("Filamento não encontrado"));
                pfList.add(ProductFilament.builder()
                        .product(product)
                        .filament(filament)
                        .weightG(pfDto.getWeightG())
                        .build());
            }
            product.setFilaments(pfList);
        }

        Product saved = productRepository.save(product);
        return convertToDto(saved);
    }

    @Transactional
    public ProductDto update(UUID id, ProductDto dto) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produto não encontrado"));

        product.setName(dto.getName().trim());
        product.setDescription(dto.getDescription());
        product.setPrintingHours(dto.getPrintingHours());
        product.setProfitMargin(dto.getProfitMargin());
        product.setSalePriceParticular(dto.getSalePriceParticular());
        product.setSalePriceShoppe(dto.getSalePriceShoppe());
        if (dto.getActive() != null) {
            product.setActive(dto.getActive());
        }
        if (dto.getImagesVideosPaths() != null) {
            product.setImagesVideosPaths(dto.getImagesVideosPaths());
        }

        product.getFilaments().clear();
        if (dto.getFilaments() != null) {
            for (com.print3d.ecommerce.dto.ProductFilamentDto pfDto : dto.getFilaments()) {
                Filament filament = filamentRepository.findById(pfDto.getFilamentId())
                        .orElseThrow(() -> new RuntimeException("Filamento não encontrado"));
                product.getFilaments().add(ProductFilament.builder()
                        .product(product)
                        .filament(filament)
                        .weightG(pfDto.getWeightG())
                        .build());
            }
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
    public PricingResult getPricingPreview(com.print3d.ecommerce.dto.ProductPricingPreviewRequestDto requestDto) {
        List<ProductFilament> pfList = new ArrayList<>();
        Product product = Product.builder()
                .printingHours(requestDto.getPrintingHours())
                .profitMargin(requestDto.getProfitMargin())
                .build();

        if (requestDto.getFilaments() != null) {
            for (com.print3d.ecommerce.dto.ProductFilamentDto pfDto : requestDto.getFilaments()) {
                Filament filament = filamentRepository.findById(pfDto.getFilamentId())
                        .orElseThrow(() -> new RuntimeException("Filamento não encontrado"));
                pfList.add(ProductFilament.builder()
                        .product(product)
                        .filament(filament)
                        .weightG(pfDto.getWeightG())
                        .build());
            }
        }
        product.setFilaments(pfList);

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
        List<ProductFilamentDto> filamentsDto = new ArrayList<>();
        BigDecimal totalWeight = BigDecimal.ZERO;
        if (product.getFilaments() != null) {
            for (ProductFilament pf : product.getFilaments()) {
                String label = String.format("%s - %s (%s)",
                        pf.getFilament().getMaterial(),
                        pf.getFilament().getBrand(),
                        pf.getFilament().getColor()
                );
                filamentsDto.add(ProductFilamentDto.builder()
                        .filamentId(pf.getFilament().getId())
                        .filamentLabel(label)
                        .weightG(pf.getWeightG())
                        .pricePerKg(pf.getFilament().getPricePerKg())
                        .build());
                if (pf.getWeightG() != null) {
                    totalWeight = totalWeight.add(pf.getWeightG());
                }
            }
        }

        com.print3d.ecommerce.dto.PricingResult pricing = pricingCalculatorService.calculatePricing(product);

        return ProductDto.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .weightG(totalWeight)
                .printingHours(product.getPrintingHours())
                .filaments(filamentsDto)
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
