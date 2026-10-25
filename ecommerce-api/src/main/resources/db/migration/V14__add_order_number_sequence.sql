-- Sequência numérica de pedidos iniciando em 100122
CREATE SEQUENCE IF NOT EXISTS seq_order_number START WITH 100122 INCREMENT BY 1;

ALTER TABLE tb_order
    ADD COLUMN IF NOT EXISTS order_number BIGINT DEFAULT nextval('seq_order_number');

UPDATE tb_order
SET order_number = nextval('seq_order_number')
WHERE order_number IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_tb_order_order_number ON tb_order(order_number);
