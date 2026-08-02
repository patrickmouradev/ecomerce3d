package com.print3d.ecommerce.security;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Component
public class DynamicCorsConfigurationSource implements CorsConfigurationSource {

    private final JdbcTemplate jdbcTemplate;

    public DynamicCorsConfigurationSource(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public CorsConfiguration getCorsConfiguration(HttpServletRequest request) {
        CorsConfiguration config = new CorsConfiguration();
        
        // Carrega as origens permitidas de forma dinâmica do banco de dados
        List<String> allowedOrigins = fetchAllowedOriginsFromDb();
        
        config.setAllowedOrigins(allowedOrigins);
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Cache-Control", "Accept"));
        config.setExposedHeaders(Collections.singletonList("Authorization"));
        config.setAllowCredentials(true);
        
        return config;
    }

    private List<String> fetchAllowedOriginsFromDb() {
        try {
            String sql = "SELECT param_value FROM tb_system_parameter WHERE description = 'CORS_ALLOWED_ORIGINS' AND active = true";
            List<String> results = jdbcTemplate.query(sql, (rs, rowNum) -> rs.getString("param_value"));
            
            if (!results.isEmpty() && results.get(0) != null && !results.get(0).trim().isEmpty()) {
                // Suporta múltiplos valores separados por vírgula no banco
                return Arrays.stream(results.get(0).split(","))
                        .map(String::trim)
                        .toList();
            }
        } catch (Exception e) {
            // Em caso de falha de conexão ou tabela inexistente na carga inicial, usa fallback de dev
        }
        // Fallback padrão para desenvolvimento (Vite default + portas comuns)
        return Arrays.asList("http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173");
    }
}
