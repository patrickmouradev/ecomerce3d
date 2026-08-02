package com.print3d.ecommerce.security;

import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.print3d.ecommerce.cryptography.EncryptionKeyHolder;
import com.print3d.ecommerce.model.Role;
import com.print3d.ecommerce.model.User;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class TokenProvider {

    // Token expira em 24 horas (86400 segundos)
    private static final long JWT_EXPIRATION_MS = 86400000L;

    /**
     * Gera um token JWT com claims customizadas de perfis e perfil ativo
     */
    public String generateToken(User user, String activeRole) {
        try {
            Set<String> roles = user.getRoles().stream()
                    .map(Role::getName)
                    .collect(Collectors.toSet());

            // Valida se o activeRole solicitado pertence ao usuário
            if (!roles.contains(activeRole)) {
                throw new IllegalArgumentException("O usuário não possui o perfil solicitado: " + activeRole);
            }

            Date now = new Date();
            Date expiryDate = new Date(now.getTime() + JWT_EXPIRATION_MS);

            // Montar claims
            JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                    .subject(user.getId().toString())
                    .claim("email", user.getEmail())
                    .claim("name", user.getName())
                    .claim("roles", List.copyOf(roles))
                    .claim("activeRole", activeRole)
                    .issueTime(now)
                    .expirationTime(expiryDate)
                    .build();

            // Assinar com a chave secreta (usando a mesma chave de criptografia)
            JWSSigner signer = new MACSigner(EncryptionKeyHolder.getSecretKey().getBytes());
            SignedJWT signedJWT = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claimsSet);
            signedJWT.sign(signer);

            return signedJWT.serialize();
        } catch (Exception e) {
            throw new RuntimeException("Erro ao gerar token JWT", e);
        }
    }

    /**
     * Valida o token JWT e retorna o set de claims
     */
    public JWTClaimsSet getClaimsFromToken(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            JWSVerifier verifier = new MACVerifier(EncryptionKeyHolder.getSecretKey().getBytes());
            
            if (!signedJWT.verify(verifier)) {
                throw new RuntimeException("Assinatura de token inválida");
            }

            JWTClaimsSet claims = signedJWT.getJWTClaimsSet();
            Date now = new Date();
            if (claims.getExpirationTime().before(now)) {
                throw new RuntimeException("Token expirado");
            }

            return claims;
        } catch (Exception e) {
            throw new RuntimeException("Token inválido ou expirado", e);
        }
    }
}
