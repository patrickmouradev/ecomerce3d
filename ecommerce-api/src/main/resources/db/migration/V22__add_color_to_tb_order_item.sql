-- Adiciona a coluna color na tabela tb_order_item para registrar a cor escolhida pelo cliente
ALTER TABLE tb_order_item
    ADD COLUMN IF NOT EXISTS color VARCHAR(100);
