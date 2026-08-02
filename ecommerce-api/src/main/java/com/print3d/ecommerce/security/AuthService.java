package com.print3d.ecommerce.security;

import com.print3d.ecommerce.dto.LocalLoginRequestDto;
import com.print3d.ecommerce.dto.LocalRegisterRequestDto;
import com.print3d.ecommerce.model.Role;
import com.print3d.ecommerce.model.User;
import com.print3d.ecommerce.repository.RoleRepository;
import com.print3d.ecommerce.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.security.admin-first-email}")
    private String adminFirstEmail;

    public AuthService(UserRepository userRepository, RoleRepository roleRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Registra um novo usuário localmente com e-mail e senha
     */
    @Transactional
    public User registerLocal(LocalRegisterRequestDto dto) {
        log.info("Iniciando cadastro local de usuário com e-mail: {}", dto.getEmail());

        if (userRepository.findByEmail(dto.getEmail()).isPresent()) {
            throw new RuntimeException("E-mail já cadastrado");
        }

        Set<Role> roles = new HashSet<>();

        // Se for o primeiro admin (verificado pelo e-mail do .env)
        if (dto.getEmail().equalsIgnoreCase(adminFirstEmail)) {
            log.info("Auto-seed de Administrador detectado no cadastro local para: {}", dto.getEmail());
            roleRepository.findByName("ADMINISTRADOR").ifPresent(roles::add);
            roleRepository.findByName("FINANCEIRO").ifPresent(roles::add);
            roleRepository.findByName("USUARIO").ifPresent(roles::add);
        } else {
            roleRepository.findByName("USUARIO").ifPresent(roles::add);
        }

        User newUser = User.builder()
                .email(dto.getEmail())
                .name(dto.getName())
                .password(passwordEncoder.encode(dto.getPassword()))
                .active(true)
                .roles(roles)
                .build();

        return userRepository.save(newUser);
    }

    /**
     * Autentica o usuário localmente com e-mail e senha
     */
    @Transactional(readOnly = true)
    public User loginLocal(LocalLoginRequestDto dto) {
        log.info("Tentativa de login local para e-mail: {}", dto.getEmail());

        User user = userRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new RuntimeException("E-mail ou senha incorretos"));

        if (user.getPassword() == null) {
            throw new RuntimeException("Este usuário foi cadastrado via login social. Por favor, utilize o login com o Google.");
        }

        if (!passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            throw new RuntimeException("E-mail ou senha incorretos");
        }

        if (!user.isActive()) {
            throw new RuntimeException("Esta conta está inativa");
        }

        return user;
    }
}
