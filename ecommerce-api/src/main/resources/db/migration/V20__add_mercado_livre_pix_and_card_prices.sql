-- 1. Adicionar colunas de preço Mercado Livre Pix e Cartão na tabela tb_product
ALTER TABLE tb_product
    ADD COLUMN IF NOT EXISTS sale_price_mercado_livre_pix NUMERIC(10, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS sale_price_mercado_livre_card NUMERIC(10, 2) DEFAULT 0.00;

-- 2. Migrar valores existentes da coluna sale_price_mercado_livre
UPDATE tb_product
SET sale_price_mercado_livre_pix = COALESCE(sale_price_mercado_livre, 0.00),
    sale_price_mercado_livre_card = COALESCE(sale_price_mercado_livre, 0.00)
WHERE (sale_price_mercado_livre_pix IS NULL OR sale_price_mercado_livre_pix = 0.00)
  AND sale_price_mercado_livre IS NOT NULL 
  AND sale_price_mercado_livre > 0.00;

-- 3. Atualizar Taxa Mercado Livre existente para Taxa Mercado Livre Pix (0.99%)
UPDATE tb_basic_production_cost
SET description = 'Taxa Mercado Livre Pix',
    value = 0.99,
    is_percentage = TRUE,
    updated_at = CURRENT_DATE
WHERE description = 'Taxa Mercado Livre' OR description ILIKE 'Taxa Mercado Livre';

-- 4. Inserir Taxa Mercado Livre Cartão (3.98%) se não existir
INSERT INTO tb_basic_production_cost (id, description, value, is_percentage, created_by, updated_by, created_at, updated_at, active)
SELECT gen_random_uuid(), 'Taxa Mercado Livre Cartão', 3.98, TRUE, 'system', 'system', CURRENT_DATE, CURRENT_DATE, TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM tb_basic_production_cost WHERE description = 'Taxa Mercado Livre Cartão' OR description ILIKE 'Taxa Mercado Livre Cartão'
);

-- 5. Garantir que se Taxa Mercado Livre Pix não existia, ela seja criada com 0.99%
INSERT INTO tb_basic_production_cost (id, description, value, is_percentage, created_by, updated_by, created_at, updated_at, active)
SELECT gen_random_uuid(), 'Taxa Mercado Livre Pix', 0.99, TRUE, 'system', 'system', CURRENT_DATE, CURRENT_DATE, TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM tb_basic_production_cost WHERE description = 'Taxa Mercado Livre Pix' OR description ILIKE 'Taxa Mercado Livre Pix'
);
