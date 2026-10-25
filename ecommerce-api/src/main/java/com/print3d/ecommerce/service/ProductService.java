package com.print3d.ecommerce.service;

import com.print3d.ecommerce.dto.PricingResult;
import com.print3d.ecommerce.dto.ProductDto;
import com.print3d.ecommerce.dto.ProductFilamentDto;
import com.print3d.ecommerce.dto.ProductKitItemDto;
import com.print3d.ecommerce.model.Banner;
import com.print3d.ecommerce.model.Filament;
import com.print3d.ecommerce.model.Product;
import com.print3d.ecommerce.model.ProductColor;
import com.print3d.ecommerce.model.ProductFilament;
import com.print3d.ecommerce.model.ProductKitItem;
import com.print3d.ecommerce.dto.ProductAccessoryDto;
import com.print3d.ecommerce.model.Accessory;
import com.print3d.ecommerce.model.ProductAccessory;
import com.print3d.ecommerce.repository.AccessoryRepository;
import com.print3d.ecommerce.repository.BannerRepository;
import com.print3d.ecommerce.repository.FilamentRepository;
import com.print3d.ecommerce.repository.OrderRepository;
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
    private final OrderRepository orderRepository;

    public ProductService(ProductRepository productRepository,
                          FilamentRepository filamentRepository,
                          AccessoryRepository accessoryRepository,
                          PricingCalculatorService pricingCalculatorService,
                          FileStorageService fileStorageService,
                          BannerRepository bannerRepository,
                          OrderRepository orderRepository) {
        this.productRepository = productRepository;
        this.filamentRepository = filamentRepository;
        this.accessoryRepository = accessoryRepository;
        this.pricingCalculatorService = pricingCalculatorService;
        this.fileStorageService = fileStorageService;
        this.bannerRepository = bannerRepository;
        this.orderRepository = orderRepository;
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
        List<ProductDto> dtos = new ArrayList<>(products.stream().map(this::convertToDto).toList());
        boolean desc = "desc".equalsIgnoreCase(direction);

        if ("hasAttachment".equalsIgnoreCase(sortBy)) {
            dtos.sort((a, b) -> {
                boolean hasA = a.getImagesVideosPaths() != null && !a.getImagesVideosPaths().isEmpty();
                boolean hasB = b.getImagesVideosPaths() != null && !b.getImagesVideosPaths().isEmpty();
                int cmp = Boolean.compare(hasA, hasB);
                return desc ? -cmp : cmp;
            });
        } else if ("weightG".equalsIgnoreCase(sortBy)) {
            dtos.sort((a, b) -> {
                BigDecimal wA = a.getWeightG() != null ? a.getWeightG() : BigDecimal.ZERO;
                BigDecimal wB = b.getWeightG() != null ? b.getWeightG() : BigDecimal.ZERO;
                int cmp = wA.compareTo(wB);
                return desc ? -cmp : cmp;
            });
        }

        return dtos;
    }

    @Transactional(readOnly = true)
    public ProductDto getById(UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produto não encontrado"));
        return convertToDto(product);
    }

    @Transactional
    public ProductDto create(ProductDto dto) {
        List<String> validColors = dto.getAvailableColors() == null
                ? List.of()
                : dto.getAvailableColors().stream()
                        .filter(c -> c != null && !c.trim().isEmpty())
                        .map(String::trim)
                        .toList();
        boolean isMultiColor = Boolean.TRUE.equals(dto.getMultiColor()) || validColors.isEmpty();
        boolean isKit = Boolean.TRUE.equals(dto.getIsKit());
        Product product = Product.builder()
                .name(dto.getName().trim())
                .description(dto.getDescription())
                .printingHours(dto.getPrintingHours())
                .profitMargin(dto.getProfitMargin())
                .salePriceParticular(dto.getSalePriceParticular())
                .salePriceShoppe(dto.getSalePriceShoppe())
                .salePriceMercadoLivre(dto.getSalePriceMercadoLivre() != null ? dto.getSalePriceMercadoLivre() : BigDecimal.ZERO)
                .multiColor(isMultiColor)
                .isKit(isKit)
                .active(dto.getActive() != null ? dto.getActive() : true)
                .imagesVideosPaths(dto.getImagesVideosPaths() != null ? dto.getImagesVideosPaths() : new ArrayList<>())
                .build();

        if (isKit && dto.getKitItems() != null) {
            List<ProductKitItem> kitList = new ArrayList<>();
            for (ProductKitItemDto kiDto : dto.getKitItems()) {
                if (kiDto.getProductId() != null) {
                    Product child = productRepository.findById(kiDto.getProductId())
                            .orElseThrow(() -> new RuntimeException("Produto do Kit não encontrado"));
                    kitList.add(ProductKitItem.builder()
                            .kitProduct(product)
                            .childProduct(child)
                            .quantity(kiDto.getQuantity() != null && kiDto.getQuantity() > 0 ? kiDto.getQuantity() : 1)
                            .build());
                }
            }
            product.setKitItems(kitList);
        }

        if (!isMultiColor) {
            List<ProductColor> pcList = new ArrayList<>();
            for (String colorStr : validColors) {
                pcList.add(ProductColor.builder()
                        .product(product)
                        .color(colorStr)
                        .build());
            }
            product.setAvailableColors(pcList);
        }

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

        List<String> validColors = dto.getAvailableColors() == null
                ? List.of()
                : dto.getAvailableColors().stream()
                        .filter(c -> c != null && !c.trim().isEmpty())
                        .map(String::trim)
                        .toList();
        boolean isMultiColor = Boolean.TRUE.equals(dto.getMultiColor()) || validColors.isEmpty();
        boolean isKit = Boolean.TRUE.equals(dto.getIsKit());
        product.setName(dto.getName().trim());
        product.setDescription(dto.getDescription());
        product.setPrintingHours(dto.getPrintingHours());
        product.setProfitMargin(dto.getProfitMargin());
        product.setSalePriceParticular(dto.getSalePriceParticular());
        product.setSalePriceShoppe(dto.getSalePriceShoppe());
        product.setSalePriceMercadoLivre(dto.getSalePriceMercadoLivre() != null ? dto.getSalePriceMercadoLivre() : BigDecimal.ZERO);
        product.setMultiColor(isMultiColor);
        product.setKit(isKit);
        if (dto.getActive() != null) {
            product.setActive(dto.getActive());
        }
        if (dto.getImagesVideosPaths() != null) {
            product.setImagesVideosPaths(dto.getImagesVideosPaths());
        }

        product.getKitItems().clear();
        if (isKit && dto.getKitItems() != null) {
            for (ProductKitItemDto kiDto : dto.getKitItems()) {
                if (kiDto.getProductId() != null) {
                    Product child = productRepository.findById(kiDto.getProductId())
                            .orElseThrow(() -> new RuntimeException("Produto do Kit não encontrado"));
                    product.getKitItems().add(ProductKitItem.builder()
                            .kitProduct(product)
                            .childProduct(child)
                            .quantity(kiDto.getQuantity() != null && kiDto.getQuantity() > 0 ? kiDto.getQuantity() : 1)
                            .build());
                }
            }
        }

        product.getAvailableColors().clear();
        if (!isMultiColor) {
            for (String colorStr : validColors) {
                product.getAvailableColors().add(ProductColor.builder()
                        .product(product)
                        .color(colorStr)
                        .build());
            }
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
    public ProductDto toggleActive(UUID id, boolean active) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produto não encontrado"));
        product.setActive(active);
        Product updated = productRepository.save(product);

        // Sincroniza status dos banners vinculados a este produto
        List<Banner> banners = bannerRepository.findByProductIdOrderByDisplayOrderAsc(id);
        for (Banner banner : banners) {
            banner.setActive(active);
        }
        bannerRepository.saveAll(banners);

        return convertToDto(updated);
    }

    @Transactional
    public void delete(UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produto não encontrado"));

        if (orderRepository.existsSalesByProductId(id)) {
            throw new IllegalStateException("Não é possível excluir este produto pois existem vendas vinculadas a ele. Para retirá-lo do catálogo, apenas desmarque a opção Ativo.");
        }

        // Remove banners vinculados ao produto antes da exclusão física
        bannerRepository.deleteByProductId(id);
        productRepository.delete(product);
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
        if (sortBy.equalsIgnoreCase("hasAttachment") || sortBy.equalsIgnoreCase("weightG")) {
            return Sort.by(Sort.Direction.ASC, "name");
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

        List<String> colorsDto = new ArrayList<>();
        if (!product.isMultiColor() && product.getAvailableColors() != null) {
            for (ProductColor pc : product.getAvailableColors()) {
                if (pc.getColor() != null && !pc.getColor().trim().isEmpty()) {
                    colorsDto.add(pc.getColor().trim());
                }
            }
        }

        List<ProductKitItemDto> kitItemsDto = new ArrayList<>();
        if (product.isKit() && product.getKitItems() != null) {
            for (ProductKitItem ki : product.getKitItems()) {
                if (ki.getChildProduct() != null) {
                    kitItemsDto.add(ProductKitItemDto.builder()
                            .productId(ki.getChildProduct().getId())
                            .productName(ki.getChildProduct().getName())
                            .salePriceParticular(ki.getChildProduct().getSalePriceParticular())
                            .quantity(ki.getQuantity())
                            .build());
                }
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
                .multiColor(product.isMultiColor())
                .availableColors(colorsDto)
                .isKit(product.isKit())
                .kitItems(kitItemsDto)
                .productionCost(pricing.getProductionCost())
                .suggestedPrice(pricing.getSuggestedPrice())
                .suggestedPriceShoppe(pricing.getSuggestedPriceShoppe())
                .suggestedPriceParticular(pricing.getSuggestedPriceParticular())
                .suggestedPriceMercadoLivre(pricing.getSuggestedPriceMercadoLivre())
                .netProfit(pricing.getNetProfit())
                .netProfitShoppe(pricing.getNetProfitShoppe())
                .netProfitMercadoLivre(pricing.getNetProfitMercadoLivre())
                .energyCostTotal(pricing.getEnergyCostTotal())
                .printerWearTotal(pricing.getPrinterWearTotal())
                .packagingCost(pricing.getPackagingCost())
                .accessoryCostTotal(pricing.getAccessoryCostTotal())
                .shopeeCostsTotal(pricing.getShopeeCostsTotal())
                .mercadoLivreCostsTotal(pricing.getMercadoLivreCostsTotal())
                .productionCostWithoutShoppe(pricing.getProductionCostWithoutShoppe())
                .profitMargin(product.getProfitMargin())
                .salePriceParticular(product.getSalePriceParticular())
                .salePriceShoppe(product.getSalePriceShoppe())
                .salePriceMercadoLivre(product.getSalePriceMercadoLivre() != null ? product.getSalePriceMercadoLivre() : BigDecimal.ZERO)
                .active(product.isActive())
                .imagesVideosPaths(product.getImagesVideosPaths())
                .bannerImagesPaths(bannerPaths)
                .createdAt(product.getCreatedAt() != null ? product.getCreatedAt().format(DatePatterns.DATE_TIME_FORMATTER) : null)
                .updatedAt(product.getUpdatedAt() != null ? product.getUpdatedAt().format(DatePatterns.DATE_TIME_FORMATTER) : null)
                .build();
    }
}
