-- Adicionar flag is_kit no produto e tabela de itens que compõem o Kit
ALTER TABLE tb_product
    ADD COLUMN IF NOT EXISTS is_kit BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS tb_product_kit_item (
    id UUID PRIMARY KEY,
    kit_product_id UUID NOT NULL REFERENCES tb_product(id) ON DELETE CASCADE,
    child_product_id UUID NOT NULL REFERENCES tb_product(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_product_kit_item_kit_id ON tb_product_kit_item(kit_product_id);
