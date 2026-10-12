-- 1. Criar a tabela de acessórios globais
CREATE TABLE tb_accessory (
    id UUID PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Criar a tabela de associação para múltiplos acessórios por produto
CREATE TABLE tb_product_accessory (
    product_id UUID NOT NULL REFERENCES tb_product(id) ON DELETE CASCADE,
    accessory_id UUID NOT NULL REFERENCES tb_accessory(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    PRIMARY KEY (product_id, accessory_id)
);

-- 3. Criar índices para otimização de joins e buscas
CREATE INDEX idx_product_accessory_accessory_id ON tb_product_accessory(accessory_id);
CREATE INDEX idx_accessory_active ON tb_accessory(active);
