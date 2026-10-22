-- Adicionar campos de checkout, pagamento Mercado Pago (PIX / Cartão) e snapshot de entrega na tabela de pedidos
ALTER TABLE tb_order
    ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
    ADD COLUMN IF NOT EXISTS payment_status_detail VARCHAR(100),
    ADD COLUMN IF NOT EXISTS shipping_address_json TEXT,
    ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(255),
    ADD COLUMN IF NOT EXISTS pix_qr_code TEXT,
    ADD COLUMN IF NOT EXISTS pix_qr_code_base64 TEXT;
