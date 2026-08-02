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

    @Column(name = "weight_g", nullable = false, precision = 10, scale = 2)
    private BigDecimal weightG;

    @Column(name = "printing_hours", nullable = false, precision = 10, scale = 2)
    private BigDecimal printingHours;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "filament_id", nullable = false)
    private Filament filament;

    @Column(name = "profit_margin", nullable = false, precision = 10, scale = 2)
    private BigDecimal profitMargin;

    @Column(name = "sale_price_particular", nullable = false, precision = 10, scale = 2)
    private BigDecimal salePriceParticular;

    @Column(name = "sale_price_shoppe", nullable = false, precision = 10, scale = 2)
    private BigDecimal salePriceShoppe;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    // Hibernate maps dynamic array string to pg text[] or TEXT mapping
    // We can map it as element collection or standard attribute converter or just a custom parser.
    // For Flyway text[], using PostgreSQL list collection is mapped natively or using @ElementCollection.
    // Let's use @ElementCollection with a JoinTable to keep it standard across Hibernate dialects,
    // or keep it as simple list with database text[] using simple Converter or ElementCollection.
    // Actually, ElementCollection with a separate table tb_product_media is highly standard and fully safe!
    // But since the database table `tb_product` was already created with `images_videos_paths TEXT[]` in Flyway,
    // let's use a JPA Converter that converts List<String> to SQL Array (or maps natively).
    // Mapping TEXT[] in Postgres via hibernate 6 is natively supported by List<String>.
    // Let's see: Hibernate 6 natively maps List<String> to TEXT[] using @Column(columnDefinition = "text[]").
    // Let's do that! It is very elegant.
    @Column(name = "images_videos_paths", columnDefinition = "text[]")
    private List<String> imagesVideosPaths;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
