-- Criação da tabela de mensagens (chat do pedido entre Comprador e Vendedor)
CREATE TABLE IF NOT EXISTS tb_order_message (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES tb_order(id) ON DELETE CASCADE,
    sender_user_id UUID REFERENCES tb_user(id) ON DELETE SET NULL,
    sender_name VARCHAR(150) NOT NULL,
    sender_role VARCHAR(50) NOT NULL, -- COMPRADOR ou VENDEDOR
    message TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_order_message_order_id ON tb_order_message(order_id, created_at);
