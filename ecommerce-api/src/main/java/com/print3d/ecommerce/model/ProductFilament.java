package com.print3d.ecommerce.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "tb_product_filament")
@IdClass(ProductFilamentId.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductFilament {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Id
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "filament_id", nullable = false)
    private Filament filament;

    @Column(name = "weight_g", nullable = false, precision = 10, scale = 3)
    private BigDecimal weightG;
}
