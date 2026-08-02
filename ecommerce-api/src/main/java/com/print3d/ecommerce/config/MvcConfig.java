package com.print3d.ecommerce.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;

@Configuration
public class MvcConfig implements WebMvcConfigurer {

    @Value("${app.upload.dir}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Assegura que o diretório de uploads existe
        File uploadFolder = new File(uploadDir);
        if (!uploadFolder.exists()) {
            uploadFolder.mkdirs();
        }

        String path = uploadFolder.getAbsolutePath();
        // Corrige padrão de barras para o Windows se necessário
        if (!path.endsWith(File.separator)) {
            path += File.separator;
        }

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + path);
    }
}
