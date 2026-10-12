package com.print3d.ecommerce.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tb_product_accessory")
@IdClass(ProductAccessoryId.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductAccessory {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Id
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "accessory_id", nullable = false)
    private Accessory accessory;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;
}
