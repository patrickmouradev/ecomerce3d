package com.print3d.ecommerce.config;

import nl.martijndwars.webpush.PushService;
import nl.martijndwars.webpush.Utils;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.Security;
import java.security.spec.ECGenParameterSpec;
import java.util.Base64;

@Configuration
public class WebPushConfig {

    private static final Logger log = LoggerFactory.getLogger(WebPushConfig.class);

    @Value("${app.vapid.public-key:}")
    private String publicKey;

    @Value("${app.vapid.private-key:}")
    private String privateKey;

    @Value("${app.vapid.subject:mailto:3dprintpng@gmail.com}")
    private String subject;

    private String resolvedPublicKey;

    @Bean
    public PushService pushService() {
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(new BouncyCastleProvider());
        }

        PushService pushService = new PushService();
        pushService.setSubject(subject);

        try {
            if (publicKey != null && !publicKey.trim().isEmpty() &&
                privateKey != null && !privateKey.trim().isEmpty()) {
                pushService.setPublicKey(Utils.loadPublicKey(publicKey.trim()));
                pushService.setPrivateKey(Utils.loadPrivateKey(privateKey.trim()));
                this.resolvedPublicKey = publicKey.trim();
                log.info("PushService inicializado com chaves VAPID configuradas em variáveis de ambiente.");
            } else {
                log.warn("Chaves VAPID não configuradas em app.vapid.*. Gerando par de chaves EC efêmero...");
                KeyPairGenerator kpg = KeyPairGenerator.getInstance("ECDSA", BouncyCastleProvider.PROVIDER_NAME);
                kpg.initialize(new ECGenParameterSpec("secp256r1"));
                KeyPair pair = kpg.generateKeyPair();
                
                pushService.setPublicKey(pair.getPublic());
                pushService.setPrivateKey(pair.getPrivate());
                
                byte[] pubBytes = Utils.encode((org.bouncycastle.jce.interfaces.ECPublicKey) pair.getPublic());
                this.resolvedPublicKey = Base64.getUrlEncoder().withoutPadding().encodeToString(pubBytes);
                
                log.info("Chave Pública VAPID efêmera gerada: {}", this.resolvedPublicKey);
            }
        } catch (Exception e) {
            log.error("Erro ao configurar PushService VAPID: {}", e.getMessage(), e);
        }

        return pushService;
    }

    public String getResolvedPublicKey() {
        return resolvedPublicKey != null ? resolvedPublicKey : publicKey;
    }
}
