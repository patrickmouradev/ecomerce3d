-- Adicionar flag multi_color no produto e tabela de cores disponíveis por produto
ALTER TABLE tb_product
    ADD COLUMN IF NOT EXISTS multi_color BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS tb_product_color (
    id UUID PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES tb_product(id) ON DELETE CASCADE,
    color VARCHAR(100) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_product_color_product_id ON tb_product_color(product_id);
