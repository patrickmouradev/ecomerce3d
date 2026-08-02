ALTER TABLE tb_product DROP COLUMN sale_price;
ALTER TABLE tb_product ADD COLUMN sale_price_particular NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE tb_product ADD COLUMN sale_price_shoppe NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
