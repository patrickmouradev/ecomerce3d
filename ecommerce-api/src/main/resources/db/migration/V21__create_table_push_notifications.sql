-- ============================================================
-- Migração V21: Tabelas de Web Push e Controle de Cadência Anti-Spam
-- ============================================================

-- 1. Inscrições de Dispositivos Móveis e Desktop (Web Push)
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES tb_user(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    device_type VARCHAR(32) NOT NULL,
    user_agent TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_push_sub_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_sub_active ON push_subscriptions(active);

-- 2. Histórico de Campanhas / Disparos Realizados (Painel Admin)
CREATE TABLE IF NOT EXISTS push_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(120) NOT NULL,
    body VARCHAR(255) NOT NULL,
    target_url VARCHAR(255) DEFAULT '/',
    target_role VARCHAR(50),
    target_user_id UUID REFERENCES tb_user(id) ON DELETE SET NULL,
    total_targeted INT NOT NULL DEFAULT 0,
    total_success INT NOT NULL DEFAULT 0,
    total_failed INT NOT NULL DEFAULT 0,
    created_by_user_id UUID REFERENCES tb_user(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Recibos Detalhados de Entrega (Auditoria)
CREATE TABLE IF NOT EXISTS push_delivery_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES push_campaigns(id) ON DELETE CASCADE,
    subscription_id UUID NOT NULL REFERENCES push_subscriptions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES tb_user(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL,
    http_status_code INT,
    delivered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_receipt_campaign_id ON push_delivery_receipts(campaign_id);

-- 4. Colunas de Controle de Cadência Anti-Spam de Pedidos Pendentes em tb_order
ALTER TABLE tb_order
    ADD COLUMN IF NOT EXISTS pending_push_count INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_pending_push_at TIMESTAMP;
