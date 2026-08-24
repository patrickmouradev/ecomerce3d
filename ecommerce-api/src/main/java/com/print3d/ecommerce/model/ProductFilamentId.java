package com.print3d.ecommerce.model;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class ProductFilamentId implements Serializable {
    private UUID product;
    private UUID filament;

    public ProductFilamentId() {}

    public ProductFilamentId(UUID product, UUID filament) {
        this.product = product;
        this.filament = filament;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ProductFilamentId that = (ProductFilamentId) o;
        return Objects.equals(product, that.product) && Objects.equals(filament, that.filament);
    }

    @Override
    public int hashCode() {
        return Objects.hash(product, filament);
    }
}
