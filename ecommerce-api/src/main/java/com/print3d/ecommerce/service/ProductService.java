package com.print3d.ecommerce.service;

import com.print3d.ecommerce.dto.PricingResult;
import com.print3d.ecommerce.dto.ProductDto;
import com.print3d.ecommerce.dto.ProductFilamentDto;
import com.print3d.ecommerce.model.Banner;
import com.print3d.ecommerce.model.Filament;
import com.print3d.ecommerce.model.Product;
import com.print3d.ecommerce.model.ProductFilament;
import com.print3d.ecommerce.dto.ProductAccessoryDto;
import com.print3d.ecommerce.model.Accessory;
import com.print3d.ecommerce.model.ProductAccessory;
import com.print3d.ecommerce.repository.AccessoryRepository;
import com.print3d.ecommerce.repository.BannerRepository;
import com.print3d.ecommerce.repository.FilamentRepository;
import com.print3d.ecommerce.repository.ProductRepository;
import com.print3d.ecommerce.util.DatePatterns;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final FilamentRepository filamentRepository;
    private final AccessoryRepository accessoryRepository;
    private final PricingCalculatorService pricingCalculatorService;
    private final FileStorageService fileStorageService;
    private final BannerRepository bannerRepository;

    public ProductService(ProductRepository productRepository,
                          FilamentRepository filamentRepository,
                          AccessoryRepository accessoryRepository,
                          PricingCalculatorService pricingCalculatorService,
                          FileStorageService fileStorageService,
                          BannerRepository bannerRepository) {
        this.productRepository = productRepository;
        this.filamentRepository = filamentRepository;
        this.accessoryRepository = accessoryRepository;
        this.pricingCalculatorService = pricingCalculatorService;
        this.fileStorageService = fileStorageService;
        this.bannerRepository = bannerRepository;
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

        if (dto.getAccessories() != null) {
            List<ProductAccessory> paList = new ArrayList<>();
            for (com.print3d.ecommerce.dto.ProductAccessoryDto paDto : dto.getAccessories()) {
                Accessory accessory = accessoryRepository.findById(paDto.getAccessoryId())
                        .orElseThrow(() -> new RuntimeException("Acessório não encontrado"));
                paList.add(ProductAccessory.builder()
                        .product(product)
                        .accessory(accessory)
                        .quantity(paDto.getQuantity())
                        .build());
            }
            product.setAccessories(paList);
        }

        Product saved = productRepository.save(product);

        // Sincroniza as imagens escolhidas para o banner do produto
        if (dto.getBannerImagesPaths() != null) {
            syncProductBanners(saved, dto.getBannerImagesPaths());
        }

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

        product.getAccessories().clear();
        if (dto.getAccessories() != null) {
            for (com.print3d.ecommerce.dto.ProductAccessoryDto paDto : dto.getAccessories()) {
                Accessory accessory = accessoryRepository.findById(paDto.getAccessoryId())
                        .orElseThrow(() -> new RuntimeException("Acessório não encontrado"));
                product.getAccessories().add(ProductAccessory.builder()
                        .product(product)
                        .accessory(accessory)
                        .quantity(paDto.getQuantity())
                        .build());
            }
        }

        Product updated = productRepository.save(product);

        // Sincroniza as imagens escolhidas para o banner do produto
        if (dto.getBannerImagesPaths() != null) {
            syncProductBanners(updated, dto.getBannerImagesPaths());
        }

        return convertToDto(updated);
    }

    @Transactional
    public void logicalDelete(UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produto não encontrado"));
        product.setActive(false);
        productRepository.save(product);

        // Inativa os banners vinculados a este produto
        List<Banner> banners = bannerRepository.findByProductIdOrderByDisplayOrderAsc(id);
        for (Banner banner : banners) {
            banner.setActive(false);
        }
        bannerRepository.saveAll(banners);
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

        if (requestDto.getAccessories() != null) {
            List<ProductAccessory> paList = new ArrayList<>();
            for (com.print3d.ecommerce.dto.ProductAccessoryDto paDto : requestDto.getAccessories()) {
                Accessory accessory = accessoryRepository.findById(paDto.getAccessoryId())
                        .orElseThrow(() -> new RuntimeException("Acessório não encontrado"));
                paList.add(ProductAccessory.builder()
                        .product(product)
                        .accessory(accessory)
                        .quantity(paDto.getQuantity())
                        .build());
            }
            product.setAccessories(paList);
        }

        return pricingCalculatorService.calculatePricing(product);
    }

    /**
     * Armazena uma foto ou vídeo localmente através do FileStorageService e retorna o path de URL correspondente
     */
    public String saveUploadedFile(MultipartFile file) throws IOException {
        return fileStorageService.storeFile(file, "products");
    }

    private void syncProductBanners(Product product, List<String> bannerImagesPaths) {
        bannerRepository.deleteByProductId(product.getId());
        if (bannerImagesPaths == null || bannerImagesPaths.isEmpty()) {
            return;
        }

        List<Banner> banners = new ArrayList<>();
        int order = 0;
        for (String imagePath : bannerImagesPaths) {
            if (imagePath != null && !imagePath.trim().isEmpty()) {
                banners.add(Banner.builder()
                        .title(product.getName())
                        .imagePath(imagePath.trim())
                        .product(product)
                        .displayOrder(order++)
                        .active(product.isActive())
                        .build());
            }
        }

        if (!banners.isEmpty()) {
            bannerRepository.saveAll(banners);
        }
    }

    private Sort buildSort(String sortBy, String direction) {
        Sort.Direction dir = direction.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        if (sortBy.equalsIgnoreCase("price")) {
            return Sort.by(dir, "salePriceParticular");
        }
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

        List<ProductAccessoryDto> accessoriesDto = new ArrayList<>();
        if (product.getAccessories() != null) {
            for (ProductAccessory pa : product.getAccessories()) {
                accessoriesDto.add(ProductAccessoryDto.builder()
                        .accessoryId(pa.getAccessory().getId())
                        .description(pa.getAccessory().getDescription())
                        .price(pa.getAccessory().getPrice())
                        .quantity(pa.getQuantity())
                        .build());
            }
        }

        com.print3d.ecommerce.dto.PricingResult pricing = pricingCalculatorService.calculatePricing(product);

        // Busca as imagens que estão ativas no banner deste produto
        List<String> bannerPaths = bannerRepository.findByProductIdAndActiveTrueOrderByDisplayOrderAsc(product.getId())
                .stream()
                .map(Banner::getImagePath)
                .toList();

        return ProductDto.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .weightG(totalWeight)
                .printingHours(product.getPrintingHours())
                .filaments(filamentsDto)
                .accessories(accessoriesDto)
                .productionCost(pricing.getProductionCost())
                .suggestedPrice(pricing.getSuggestedPrice())
                .suggestedPriceShoppe(pricing.getSuggestedPriceShoppe())
                .suggestedPriceParticular(pricing.getSuggestedPriceParticular())
                .netProfit(pricing.getNetProfit())
                .netProfitShoppe(pricing.getNetProfitShoppe())
                .energyCostTotal(pricing.getEnergyCostTotal())
                .printerWearTotal(pricing.getPrinterWearTotal())
                .packagingCost(pricing.getPackagingCost())
                .accessoryCostTotal(pricing.getAccessoryCostTotal())
                .shopeeCostsTotal(pricing.getShopeeCostsTotal())
                .productionCostWithoutShoppe(pricing.getProductionCostWithoutShoppe())
                .profitMargin(product.getProfitMargin())
                .salePriceParticular(product.getSalePriceParticular())
                .salePriceShoppe(product.getSalePriceShoppe())
                .active(product.isActive())
                .imagesVideosPaths(product.getImagesVideosPaths())
                .bannerImagesPaths(bannerPaths)
                .createdAt(product.getCreatedAt() != null ? product.getCreatedAt().format(DatePatterns.DATE_TIME_FORMATTER) : null)
                .updatedAt(product.getUpdatedAt() != null ? product.getUpdatedAt().format(DatePatterns.DATE_TIME_FORMATTER) : null)
                .build();
    }
}
