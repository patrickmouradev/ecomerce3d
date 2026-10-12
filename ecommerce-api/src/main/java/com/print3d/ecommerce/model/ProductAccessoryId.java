package com.print3d.ecommerce.model;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class ProductAccessoryId implements Serializable {
    private UUID product;
    private UUID accessory;

    public ProductAccessoryId() {}

    public ProductAccessoryId(UUID product, UUID accessory) {
        this.product = product;
        this.accessory = accessory;
    }

    public UUID getProduct() {
        return product;
    }

    public void setProduct(UUID product) {
        this.product = product;
    }

    public UUID getAccessory() {
        return accessory;
    }

    public void setAccessory(UUID accessory) {
        this.accessory = accessory;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ProductAccessoryId that = (ProductAccessoryId) o;
        return Objects.equals(product, that.product) && Objects.equals(accessory, that.accessory);
    }

    @Override
    public int hashCode() {
        return Objects.hash(product, accessory);
    }
}
