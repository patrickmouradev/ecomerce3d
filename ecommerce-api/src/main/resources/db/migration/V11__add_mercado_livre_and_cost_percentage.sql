-- Adicionar flag de porcentagem nos custos básicos de produção e preço de venda Mercado Livre nos produtos
ALTER TABLE tb_basic_production_cost
    ADD COLUMN IF NOT EXISTS is_percentage BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE tb_product
    ADD COLUMN IF NOT EXISTS sale_price_mercado_livre NUMERIC(10, 2) DEFAULT 0.00;
