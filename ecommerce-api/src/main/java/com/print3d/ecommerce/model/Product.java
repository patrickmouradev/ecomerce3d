package com.print3d.ecommerce.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "tb_product")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "printing_hours", nullable = false, precision = 10, scale = 2)
    private BigDecimal printingHours;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProductFilament> filaments = new java.util.ArrayList<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProductAccessory> accessories = new java.util.ArrayList<>();

    @Column(name = "multi_color", nullable = false)
    @Builder.Default
    private boolean multiColor = false;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProductColor> availableColors = new java.util.ArrayList<>();

    @Column(name = "is_kit", nullable = false)
    @Builder.Default
    private boolean isKit = false;

    @OneToMany(mappedBy = "kitProduct", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProductKitItem> kitItems = new java.util.ArrayList<>();

    @Column(name = "profit_margin", nullable = false, precision = 10, scale = 2)
    private BigDecimal profitMargin;

    @Column(name = "sale_price_particular", nullable = false, precision = 10, scale = 2)
    private BigDecimal salePriceParticular;

    @Column(name = "sale_price_shoppe", nullable = false, precision = 10, scale = 2)
    private BigDecimal salePriceShoppe;

    @Column(name = "sale_price_mercado_livre", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal salePriceMercadoLivre = BigDecimal.ZERO;

    @Column(name = "sale_price_mercado_livre_pix", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal salePriceMercadoLivrePix = BigDecimal.ZERO;

    @Column(name = "sale_price_mercado_livre_card", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal salePriceMercadoLivreCard = BigDecimal.ZERO;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "images_videos_paths", columnDefinition = "text[]")
    private List<String> imagesVideosPaths;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public BigDecimal getSalePriceMercadoLivrePix() {
        if (salePriceMercadoLivrePix != null && salePriceMercadoLivrePix.compareTo(BigDecimal.ZERO) > 0) {
            return salePriceMercadoLivrePix;
        }
        if (salePriceMercadoLivre != null && salePriceMercadoLivre.compareTo(BigDecimal.ZERO) > 0) {
            return salePriceMercadoLivre;
        }
        return salePriceParticular != null ? salePriceParticular : BigDecimal.ZERO;
    }

    public BigDecimal getSalePriceMercadoLivreCard() {
        if (salePriceMercadoLivreCard != null && salePriceMercadoLivreCard.compareTo(BigDecimal.ZERO) > 0) {
            return salePriceMercadoLivreCard;
        }
        if (salePriceMercadoLivre != null && salePriceMercadoLivre.compareTo(BigDecimal.ZERO) > 0) {
            return salePriceMercadoLivre;
        }
        return salePriceParticular != null ? salePriceParticular : BigDecimal.ZERO;
    }
}
