-- 1. Criar a tabela de associação para múltiplos filamentos por produto
CREATE TABLE tb_product_filament (
    product_id UUID NOT NULL REFERENCES tb_product(id) ON DELETE CASCADE,
    filament_id UUID NOT NULL REFERENCES tb_filament(id) ON DELETE RESTRICT,
    weight_g NUMERIC(10, 3) NOT NULL,
    PRIMARY KEY (product_id, filament_id)
);

-- 2. Criar índice para otimização de joins no filamento
CREATE INDEX idx_product_filament_filament_id ON tb_product_filament(filament_id);

-- 3. Remover a coluna antiga de vínculo com filamento único da tabela de produtos
ALTER TABLE tb_product DROP COLUMN filament_id;

-- 4. Remover a coluna antiga de peso estático da tabela de produtos
ALTER TABLE tb_product DROP COLUMN weight_g;

-- 5. Criar índice de busca para produtos ativos
CREATE INDEX idx_product_active ON tb_product(active);
