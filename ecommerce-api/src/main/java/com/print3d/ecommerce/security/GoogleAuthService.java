package com.print3d.ecommerce.security;

import com.print3d.ecommerce.dto.GoogleUserDto;
import com.print3d.ecommerce.model.Role;
import com.print3d.ecommerce.model.User;
import com.print3d.ecommerce.repository.RoleRepository;
import com.print3d.ecommerce.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

@Service
public class GoogleAuthService {

    private static final Logger log = LoggerFactory.getLogger(GoogleAuthService.class);
    private static final String GOOGLE_TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo?id_token=";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RestTemplate restTemplate;

    @Value("${app.security.admin-first-email}")
    private String adminFirstEmail;

    public GoogleAuthService(UserRepository userRepository, RoleRepository roleRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.restTemplate = new RestTemplate();
    }

    /**
     * Valida o token ID do Google com a API oficial e registra ou atualiza o usuário no banco
     */
    @Transactional
    public User authenticateGoogleToken(String idToken) {
        String url = GOOGLE_TOKEN_INFO_URL + idToken;
        log.info("Iniciando validação de token do Google...");

        try {
            ResponseEntity<GoogleUserDto> response = restTemplate.getForEntity(url, GoogleUserDto.class);
            GoogleUserDto googleUser = response.getBody();

            if (googleUser == null || googleUser.getSub() == null) {
                throw new RuntimeException("Falha ao obter informações de perfil do Google");
            }

            if (!googleUser.isEmailVerified()) {
                throw new RuntimeException("O e-mail do Google fornecido não está verificado");
            }

            // Exemplo de log mascarado automático (nosso Logback converter tratará esse e-mail!)
            log.info("Usuário Google autenticado: Email: {}, Nome: {}", googleUser.getEmail(), googleUser.getName());

            // Tenta buscar o usuário pelo sub do Google ou pelo e-mail
            Optional<User> existingUser = userRepository.findByGoogleSub(googleUser.getSub());
            if (existingUser.isEmpty()) {
                existingUser = userRepository.findByEmail(googleUser.getEmail());
            }

            if (existingUser.isPresent()) {
                User user = existingUser.get();
                if (!user.isActive()) {
                    throw new RuntimeException("Esta conta está inativa.");
                }
                // Garante que o sub do Google está atualizado (caso a busca tenha sido por e-mail inicialmente)
                if (user.getGoogleSub() == null) {
                    user.setGoogleSub(googleUser.getSub());
                    userRepository.save(user);
                }
                return user;
            }

            // Registrar novo usuário
            return registerNewUser(googleUser);

        } catch (Exception e) {
            log.error("Erro na validação do token do Google: {}", e.getMessage());
            throw new RuntimeException("Autenticação Google falhou: " + e.getMessage(), e);
        }
    }

    private User registerNewUser(GoogleUserDto googleUser) {
        Set<Role> roles = new HashSet<>();

        // Se for o primeiro admin (verificado pelo e-mail do .env)
        if (googleUser.getEmail().equalsIgnoreCase(adminFirstEmail)) {
            log.info("Auto-seed de Administrador detectado para e-mail: {}", googleUser.getEmail());
            // Adiciona todos os perfis
            roleRepository.findByName("ADMINISTRADOR").ifPresent(roles::add);
            roleRepository.findByName("FINANCEIRO").ifPresent(roles::add);
            roleRepository.findByName("USUARIO").ifPresent(roles::add);
        } else {
            // Perfil padrão: USUARIO
            roleRepository.findByName("USUARIO").ifPresent(roles::add);
        }

        User newUser = User.builder()
                .googleSub(googleUser.getSub())
                .email(googleUser.getEmail())
                .name(googleUser.getName())
                .active(true)
                .roles(roles)
                .build();

        return userRepository.save(newUser);
    }
}
