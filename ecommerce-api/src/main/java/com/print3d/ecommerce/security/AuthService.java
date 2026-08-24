package com.print3d.ecommerce.security;

import com.print3d.ecommerce.dto.LocalLoginRequestDto;
import com.print3d.ecommerce.dto.LocalRegisterRequestDto;
import com.print3d.ecommerce.model.Role;
import com.print3d.ecommerce.model.User;
import com.print3d.ecommerce.model.PasswordResetToken;
import com.print3d.ecommerce.repository.RoleRepository;
import com.print3d.ecommerce.repository.UserRepository;
import com.print3d.ecommerce.repository.PasswordResetTokenRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetTokenRepository tokenRepository;
    private final JavaMailSender mailSender;

    @Value("${app.security.admin-first-email}")
    private String adminFirstEmail;

    @Value("${app.mail.from-address}")
    private String mailFrom;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    public AuthService(UserRepository userRepository,
                       RoleRepository roleRepository,
                       PasswordEncoder passwordEncoder,
                       PasswordResetTokenRepository tokenRepository,
                       JavaMailSender mailSender) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenRepository = tokenRepository;
        this.mailSender = mailSender;
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

    /**
     * Gera um token de recuperação de senha e envia por e-mail
     */
    @Transactional
    public void generatePasswordResetToken(String email) {
        log.info("Processando solicitação de recuperação de senha para: {}", email);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("E-mail não cadastrado"));

        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token)
                .user(user)
                .expiryDate(LocalDateTime.now().plusMinutes(15))
                .used(false)
                .build();

        tokenRepository.save(resetToken);

        // Dispara e-mail
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailFrom);
            message.setTo(user.getEmail());
            message.setSubject("3DPrintPNG - Redefinição de Senha");
            message.setText(String.format(
                    "Olá, %s!\n\n" +
                    "Você solicitou a redefinição de sua senha.\n" +
                    "Clique no link abaixo para cadastrar uma nova senha (link válido por 15 minutos):\n\n" +
                    "%s/reset-password?token=%s\n\n" +
                    "Se você não solicitou essa redefinição, apenas desconsidere este e-mail.\n\n" +
                    "Atenciosamente,\n" +
                    "Equipe 3DPrintPNG",
                    user.getName(),
                    frontendUrl,
                    token
            ));
            mailSender.send(message);
            log.info("E-mail de recuperação enviado com sucesso para {}", email);
        } catch (Exception e) {
            log.error("Falha ao enviar e-mail de recuperação para {}: {}", email, e.getMessage());
            log.info("LINK DE RECUPERAÇÃO (FALLBACK LOG): {}/reset-password?token={}", frontendUrl, token);
            throw new RuntimeException("Falha ao enviar e-mail de recuperação. Tente novamente mais tarde.");
        }
    }

    /**
     * Valida o token de recuperação e redefine a senha do usuário
     */
    @Transactional
    public void resetPassword(String token, String newPassword) {
        log.info("Redefinindo senha utilizando o token de recuperação");

        PasswordResetToken resetToken = tokenRepository.findByTokenAndUsedFalse(token)
                .orElseThrow(() -> new RuntimeException("Token inválido ou já utilizado"));

        if (resetToken.isExpired()) {
            throw new RuntimeException("Token expirado. Solicite uma nova recuperação.");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        resetToken.setUsed(true);
        tokenRepository.save(resetToken);

        log.info("Senha redefinida com sucesso para o usuário: {}", user.getEmail());
    }
}
