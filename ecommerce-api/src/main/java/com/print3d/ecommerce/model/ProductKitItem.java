package com.print3d.ecommerce.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "tb_product_kit_item")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductKitItem {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kit_product_id", nullable = false)
    private Product kitProduct;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "child_product_id", nullable = false)
    private Product childProduct;

    @Column(name = "quantity", nullable = false)
    @Builder.Default
    private Integer quantity = 1;
}
