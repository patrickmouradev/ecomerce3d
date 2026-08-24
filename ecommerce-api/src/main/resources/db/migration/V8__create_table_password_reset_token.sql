CREATE TABLE tb_password_reset_token (
    id UUID PRIMARY KEY,
    token VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES tb_user(id) ON DELETE CASCADE,
    expiry_date TIMESTAMP NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_password_reset_token_token ON tb_password_reset_token(token);
