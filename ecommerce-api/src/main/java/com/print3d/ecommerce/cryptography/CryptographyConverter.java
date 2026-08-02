package com.print3d.ecommerce.cryptography;

import com.print3d.ecommerce.util.EncryptionUtils;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class CryptographyConverter implements AttributeConverter<String, String> {

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null) {
            return null;
        }
        return EncryptionUtils.encrypt(attribute, EncryptionKeyHolder.getSecretKey());
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        try {
            return EncryptionUtils.decrypt(dbData, EncryptionKeyHolder.getSecretKey());
        } catch (Exception e) {
            // Em caso de falha de descriptografia (ex: dados legados não criptografados), retorna o próprio valor.
            return dbData;
        }
    }
}
