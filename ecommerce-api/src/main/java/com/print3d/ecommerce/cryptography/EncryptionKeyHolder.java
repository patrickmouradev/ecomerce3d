package com.print3d.ecommerce.cryptography;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class EncryptionKeyHolder {

    private static String secretKey;

    @Value("${security.cryptography.secret-key}")
    public void setSecretKey(String key) {
        secretKey = key;
    }

    public static String getSecretKey() {
        if (secretKey == null || secretKey.isEmpty()) {
            // Chave fallback de desenvolvimento caso não inicializado pelo contexto do Spring
            return "3dprintpngsupersecretkey20261234";
        }
        return secretKey;
    }
}
