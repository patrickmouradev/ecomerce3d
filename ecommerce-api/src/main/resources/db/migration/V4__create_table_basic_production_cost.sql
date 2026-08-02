CREATE TABLE tb_basic_production_cost (
    id UUID PRIMARY KEY,
    description VARCHAR(255) UNIQUE NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    created_at DATE NOT NULL DEFAULT CURRENT_DATE,
    updated_at DATE NOT NULL DEFAULT CURRENT_DATE,
    active BOOLEAN NOT NULL DEFAULT TRUE
);
