-- Habilitar a extensão para geração de UUID se necessário (opcional)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de Perfis de Acesso
CREATE TABLE tb_role (
    id UUID PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- Tabela de Usuários
CREATE TABLE tb_user (
    id UUID PRIMARY KEY,
    google_sub VARCHAR(255) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    cpf VARCHAR(255),
    address_json TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Associação de Usuários e Perfis
CREATE TABLE tb_user_role (
    user_id UUID NOT NULL REFERENCES tb_user(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES tb_role(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Tabela de Filamentos
CREATE TABLE tb_filament (
    id UUID PRIMARY KEY,
    material VARCHAR(100) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    color VARCHAR(100) NOT NULL,
    price_per_kg DECIMAL(10, 2) NOT NULL,
    quantity_kg DECIMAL(10, 3) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Parâmetros de Sistema
CREATE TABLE tb_system_parameter (
    id UUID PRIMARY KEY,
    description VARCHAR(255) UNIQUE NOT NULL,
    param_value VARCHAR(1000) NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Tabela de Produtos
CREATE TABLE tb_product (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    weight_g DECIMAL(10, 2) NOT NULL,
    printing_hours DECIMAL(10, 2) NOT NULL,
    filament_id UUID NOT NULL REFERENCES tb_filament(id),
    suggested_price DECIMAL(10, 2) NOT NULL,
    sale_price DECIMAL(10, 2) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    images_videos_paths TEXT[],
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Banners
CREATE TABLE tb_banner (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    image_path VARCHAR(500) NOT NULL,
    product_id UUID NOT NULL REFERENCES tb_product(id) ON DELETE CASCADE,
    display_order INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Tabela de Pedidos
CREATE TABLE tb_order (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES tb_user(id),
    status VARCHAR(50) NOT NULL, -- PENDENTE, PAGO, ENVIADO, CANCELADO
    shipping_cost DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    mercado_pago_payment_id VARCHAR(255),
    tracking_code VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Itens de Pedido
CREATE TABLE tb_order_item (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES tb_order(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES tb_product(id),
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL
);
