package com.print3d.ecommerce.controller;

import com.print3d.ecommerce.dto.LocalLoginRequestDto;
import com.print3d.ecommerce.dto.LocalRegisterRequestDto;
import com.print3d.ecommerce.dto.LoginRequestDto;
import com.print3d.ecommerce.dto.LoginResponseDto;
import com.print3d.ecommerce.dto.SwitchProfileRequestDto;
import com.print3d.ecommerce.security.AuthService;
import com.print3d.ecommerce.model.Role;
import com.print3d.ecommerce.model.User;
import com.print3d.ecommerce.repository.UserRepository;
import com.print3d.ecommerce.security.GoogleAuthService;
import com.print3d.ecommerce.security.TokenProvider;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Autenticação", description = "Endpoints para Login com Google e Gerenciamento de Perfis de Acesso")
public class AuthController {

    private final GoogleAuthService googleAuthService;
    private final TokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final AuthService authService;

    public AuthController(GoogleAuthService googleAuthService, TokenProvider tokenProvider, UserRepository userRepository, AuthService authService) {
        this.googleAuthService = googleAuthService;
        this.tokenProvider = tokenProvider;
        this.userRepository = userRepository;
        this.authService = authService;
    }

    // @PostMapping("/google")
    // @Operation(summary = "Realiza login ou cadastro a partir de um ID Token do Google")
    // public ResponseEntity<LoginResponseDto> loginWithGoogle(@Valid @RequestBody LoginRequestDto request) {
    //     User user = googleAuthService.authenticateGoogleToken(request.getIdToken());
    //     
    //     List<String> roles = user.getRoles().stream()
    //             .map(Role::getName)
    //             .toList();
    // 
    //     // Determina o perfil ativo inicial padrão: ADMIN > FINANCEIRO > USUARIO
    //     String defaultActiveRole = selectDefaultRole(roles);
    // 
    //     String token = tokenProvider.generateToken(user, defaultActiveRole);
    // 
    //     LoginResponseDto response = LoginResponseDto.builder()
    //             .token(token)
    //             .name(user.getName())
    //             .email(user.getEmail())
    //             .activeRole(defaultActiveRole)
    //             .roles(roles)
    //             .build();
    // 
    //     return ResponseEntity.ok(response);
    // }

    @PostMapping("/register")
    @Operation(summary = "Realiza o cadastro local de um novo usuário com e-mail e senha")
    public ResponseEntity<LoginResponseDto> register(@Valid @RequestBody LocalRegisterRequestDto request) {
        User user = authService.registerLocal(request);
        
        List<String> roles = user.getRoles().stream()
                .map(Role::getName)
                .toList();

        String defaultActiveRole = selectDefaultRole(roles);
        String token = tokenProvider.generateToken(user, defaultActiveRole);

        LoginResponseDto response = LoginResponseDto.builder()
                .token(token)
                .name(user.getName())
                .email(user.getEmail())
                .activeRole(defaultActiveRole)
                .roles(roles)
                .build();

        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    @Operation(summary = "Realiza o login local de um usuário com e-mail e senha")
    public ResponseEntity<LoginResponseDto> login(@Valid @RequestBody LocalLoginRequestDto request) {
        User user = authService.loginLocal(request);
        
        List<String> roles = user.getRoles().stream()
                .map(Role::getName)
                .toList();

        String defaultActiveRole = selectDefaultRole(roles);
        String token = tokenProvider.generateToken(user, defaultActiveRole);

        LoginResponseDto response = LoginResponseDto.builder()
                .token(token)
                .name(user.getName())
                .email(user.getEmail())
                .activeRole(defaultActiveRole)
                .roles(roles)
                .build();

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(response);
    }

    @GetMapping("/me")
    @Operation(summary = "Valida a sessão atual do usuário e renova o token JWT por mais 3600 segundos")
    public ResponseEntity<LoginResponseDto> me() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .cacheControl(CacheControl.noStore())
                    .build();
        }

        try {
            String userIdStr = (String) auth.getPrincipal();
            UUID userId = UUID.fromString(userIdStr);

            User user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .cacheControl(CacheControl.noStore())
                        .build();
            }

            List<String> roles = user.getRoles().stream()
                    .map(Role::getName)
                    .toList();

            String currentRole = null;
            if (auth.getAuthorities() != null) {
                for (GrantedAuthority ga : auth.getAuthorities()) {
                    String authority = ga.getAuthority();
                    if (authority != null && authority.startsWith("ROLE_")) {
                        currentRole = authority.substring(5);
                        break;
                    }
                }
            }

            String resolvedRole = (currentRole != null && roles.contains(currentRole))
                    ? currentRole
                    : selectDefaultRole(roles);

            String renewedToken = tokenProvider.generateToken(user, resolvedRole);

            LoginResponseDto response = LoginResponseDto.builder()
                    .token(renewedToken)
                    .name(user.getName())
                    .email(user.getEmail())
                    .activeRole(resolvedRole)
                    .roles(roles)
                    .build();

            return ResponseEntity.ok()
                    .cacheControl(CacheControl.noStore())
                    .body(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .cacheControl(CacheControl.noStore())
                    .build();
        }
    }

    @PostMapping("/switch-profile")
    @Operation(summary = "Alterna o perfil de acesso ativo para usuários com perfis múltiplos")
    public ResponseEntity<LoginResponseDto> switchProfile(@Valid @RequestBody SwitchProfileRequestDto request) {
        // Recupera o ID do usuário autenticado no contexto
        String userIdStr = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        UUID userId = UUID.fromString(userIdStr);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        List<String> roles = user.getRoles().stream()
                .map(Role::getName)
                .toList();

        // O tokenProvider valida internamente se o perfil solicitado pertence ao usuário
        String token = tokenProvider.generateToken(user, request.getActiveRole());

        LoginResponseDto response = LoginResponseDto.builder()
                .token(token)
                .name(user.getName())
                .email(user.getEmail())
                .activeRole(request.getActiveRole())
                .roles(roles)
                .build();

        return ResponseEntity.ok(response);
    }

    private String selectDefaultRole(List<String> roles) {
        if (roles.contains("ADMINISTRADOR")) {
            return "ADMINISTRADOR";
        }
        if (roles.contains("FINANCEIRO")) {
            return "FINANCEIRO";
        }
        return "USUARIO";
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Solicita a redefinição de senha enviando um e-mail com link de recuperação")
    public ResponseEntity<java.util.Map<String, String>> forgotPassword(@RequestParam String email) {
        try {
            authService.generatePasswordResetToken(email.trim());
            return ResponseEntity.ok(java.util.Map.of("message", "E-mail de recuperação enviado com sucesso"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Redefine a senha do usuário utilizando o token recebido por e-mail")
    public ResponseEntity<java.util.Map<String, String>> resetPassword(@RequestParam String token, @RequestParam String newPassword) {
        try {
            authService.resetPassword(token.trim(), newPassword);
            return ResponseEntity.ok(java.util.Map.of("message", "Senha redefinida com sucesso"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
        }
    }
}
