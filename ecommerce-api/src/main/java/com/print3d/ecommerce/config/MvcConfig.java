package com.print3d.ecommerce.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.concurrent.TimeUnit;

@Configuration
public class MvcConfig implements WebMvcConfigurer {

    private static final Logger log = LoggerFactory.getLogger(MvcConfig.class);

    @Value("${app.upload.dir}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        try {
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String locationUri = uploadPath.toUri().toString();
            if (!locationUri.endsWith("/")) {
                locationUri += "/";
            }

            log.info("Mapeando rota estática /uploads/** para localização física: {}", locationUri);

            registry.addResourceHandler("/uploads/**")
                    .addResourceLocations(locationUri)
                    .setCacheControl(CacheControl.maxAge(30, TimeUnit.DAYS).cachePublic());

        } catch (IOException e) {
            log.error("Erro ao configurar manipulador de recursos estáticos de upload", e);
        }
    }
}
