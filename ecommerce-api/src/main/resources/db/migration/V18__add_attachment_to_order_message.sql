-- Adiciona suporte a anexos (fotos e PDF) nas mensagens do chat do pedido
ALTER TABLE tb_order_message
    ALTER COLUMN message SET DEFAULT '',
    ADD COLUMN IF NOT EXISTS attachment_url VARCHAR(500),
    ADD COLUMN IF NOT EXISTS attachment_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS attachment_type VARCHAR(100);
