-- Adicionar controle de leitura nas mensagens do chat do pedido
ALTER TABLE tb_order_message
    ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_order_message_unread ON tb_order_message(order_id, sender_role, is_read);
