-- Criação da tabela de avaliações de produtos (Product Reviews)
CREATE TABLE IF NOT EXISTS tb_product_review (
    id UUID PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES tb_product(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES tb_user(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES tb_order(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    photos_urls TEXT[],
    admin_reply TEXT,
    admin_replied_at TIMESTAMP,
    visible BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_order_product_review UNIQUE (order_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_product_review_prod ON tb_product_review(product_id, visible);
CREATE INDEX IF NOT EXISTS idx_product_review_user ON tb_product_review(user_id);

-- Inserção dos parâmetros de controle de exibição para cold-start (usando UUIDs estáticos)
INSERT INTO tb_system_parameter (id, description, param_value, active, created_at, updated_at)
SELECT 'a1b2c3d4-e5f6-47a8-9b0c-1d2e3f4a5b6c', 'Exibir Avaliações na Loja', 'false', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM tb_system_parameter WHERE description = 'Exibir Avaliações na Loja');

INSERT INTO tb_system_parameter (id, description, param_value, active, created_at, updated_at)
SELECT 'b2c3d4e5-f6a7-48b9-ac1d-2e3f4a5b6c7d', 'Mínimo de Avaliações por Produto', '3', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM tb_system_parameter WHERE description = 'Mínimo de Avaliações por Produto');
