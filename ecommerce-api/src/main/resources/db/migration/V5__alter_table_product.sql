ALTER TABLE tb_product DROP COLUMN suggested_price;
ALTER TABLE tb_product ADD COLUMN profit_margin NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
