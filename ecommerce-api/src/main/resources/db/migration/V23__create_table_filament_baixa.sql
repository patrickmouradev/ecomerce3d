-- Tabela de Histórico de Baixas de Filamento
CREATE TABLE IF NOT EXISTS tb_filament_baixa (
    id UUID PRIMARY KEY,
    filament_id UUID NOT NULL REFERENCES tb_filament(id) ON DELETE CASCADE,
    quantity_g DECIMAL(10, 2) NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_filament_baixa_filament_id ON tb_filament_baixa(filament_id);
CREATE INDEX IF NOT EXISTS idx_filament_baixa_created_at ON tb_filament_baixa(created_at DESC);
