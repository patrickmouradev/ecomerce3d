package com.print3d.ecommerce.util;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;

public final class EncryptionUtils {

    private static final String ALGORITHM = "AES/CBC/PKCS5Padding";
    // IV padrão para o projeto para possibilitar buscas exatas por igualdade no banco se necessário,
    // ou podemos armazenar IV dinâmico. Um IV estático é usado para busca exata simples em base criptografada.
    private static final byte[] IV = { 0, 1, 0, 2, 0, 3, 0, 4, 0, 5, 0, 6, 0, 7, 0, 8 };

    private EncryptionUtils() {
        throw new UnsupportedOperationException("Classe utilitária não deve ser instanciada");
    }

    /**
     * Gera uma chave de 256 bits (32 bytes) a partir de qualquer string usando SHA-256
     */
    private static SecretKeySpec getSecretKey(String secretString) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] keyBytes = digest.digest(secretString.getBytes(StandardCharsets.UTF_8));
        return new SecretKeySpec(keyBytes, "AES");
    }

    /**
     * Criptografa um texto puro usando AES-256-CBC
     */
    public static String encrypt(String plainText, String secretKey) {
        if (plainText == null || secretKey == null || secretKey.isEmpty()) {
            return null;
        }
        try {
            SecretKeySpec keySpec = getSecretKey(secretKey);
            IvParameterSpec ivSpec = new IvParameterSpec(IV);
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, keySpec, ivSpec);
            byte[] encryptedBytes = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(encryptedBytes);
        } catch (Exception e) {
            throw new RuntimeException("Erro ao criptografar dados", e);
        }
    }

    /**
     * Descriptografa um texto criptografado usando AES-256-CBC
     */
    public static String decrypt(String cipherText, String secretKey) {
        if (cipherText == null || secretKey == null || secretKey.isEmpty()) {
            return null;
        }
        try {
            SecretKeySpec keySpec = getSecretKey(secretKey);
            IvParameterSpec ivSpec = new IvParameterSpec(IV);
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, keySpec, ivSpec);
            byte[] decryptedBytes = cipher.doFinal(Base64.getDecoder().decode(cipherText));
            return new String(decryptedBytes, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("Erro ao descriptografar dados. Verifique a chave.", e);
        }
    }
}
