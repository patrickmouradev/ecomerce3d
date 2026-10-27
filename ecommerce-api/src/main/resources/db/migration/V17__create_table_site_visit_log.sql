-- Tabela de rastreamento de acessos e eventos de visitantes da loja
CREATE TABLE IF NOT EXISTS tb_site_visit_log (
    id UUID PRIMARY KEY,
    visitor_id VARCHAR(64) NOT NULL,
    user_id UUID REFERENCES tb_user(id) ON DELETE SET NULL,
    user_name VARCHAR(255),
    user_email VARCHAR(255),
    ip_address VARCHAR(64),
    city VARCHAR(120),
    region VARCHAR(120),
    country VARCHAR(120),
    isp VARCHAR(180),
    device_type VARCHAR(50),
    os VARCHAR(80),
    browser VARCHAR(80),
    event_type VARCHAR(50) NOT NULL,
    page_path VARCHAR(255) NOT NULL,
    product_id UUID,
    product_name VARCHAR(255),
    referrer VARCHAR(500),
    user_agent VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_site_visit_created_at ON tb_site_visit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_visit_visitor_id ON tb_site_visit_log(visitor_id);
CREATE INDEX IF NOT EXISTS idx_site_visit_event_type ON tb_site_visit_log(event_type);
