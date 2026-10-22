package com.print3d.ecommerce.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.print3d.ecommerce.dto.AddressDto;
import com.print3d.ecommerce.dto.UserProfileDto;
import com.print3d.ecommerce.model.User;
import com.print3d.ecommerce.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/user/profile")
@Tag(name = "Perfil do Cliente", description = "Endpoints para consulta e atualização de CPF, telefone e endereço de entrega do cliente")
@SecurityRequirement(name = "bearerAuth")
public class UserProfileController {

    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public UserProfileController(UserRepository userRepository, ObjectMapper objectMapper) {
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    @GetMapping
    @Operation(summary = "Obtém os dados cadastrais e endereço salvo do usuário autenticado")
    @Transactional(readOnly = true)
    public ResponseEntity<UserProfileDto> getProfile() {
        User user = getAuthenticatedUser();
        AddressDto address = parseAddress(user.getAddressJson());

        UserProfileDto dto = UserProfileDto.builder()
                .name(user.getName())
                .email(user.getEmail())
                .cpf(user.getCpf())
                .phone(address != null ? address.getPhone() : null)
                .address(address)
                .build();

        return ResponseEntity.ok(dto);
    }

    @PutMapping
    @Operation(summary = "Atualiza nome, CPF, telefone e endereço de entrega do usuário autenticado")
    @Transactional
    public ResponseEntity<UserProfileDto> updateProfile(@RequestBody UserProfileDto request) {
        User user = getAuthenticatedUser();

        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            user.setName(request.getName().trim());
        }

        if (request.getCpf() != null) {
            String cleanCpf = request.getCpf().replaceAll("\\D", "");
            user.setCpf(cleanCpf);
        }

        AddressDto address = request.getAddress() != null ? request.getAddress() : new AddressDto();
        if (request.getPhone() != null && !request.getPhone().trim().isEmpty()) {
            address.setPhone(request.getPhone().trim());
        }

        try {
            user.setAddressJson(objectMapper.writeValueAsString(address));
        } catch (Exception e) {
            throw new RuntimeException("Erro ao serializar endereço do cliente", e);
        }

        userRepository.save(user);

        return ResponseEntity.ok(UserProfileDto.builder()
                .name(user.getName())
                .email(user.getEmail())
                .cpf(user.getCpf())
                .phone(address.getPhone())
                .address(address)
                .build());
    }

    private User getAuthenticatedUser() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new RuntimeException("Usuário não autenticado");
        }
        UUID userId = UUID.fromString((String) auth.getPrincipal());
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
    }

    private AddressDto parseAddress(String addressJson) {
        if (addressJson == null || addressJson.trim().isEmpty()) {
            return new AddressDto();
        }
        try {
            return objectMapper.readValue(addressJson, AddressDto.class);
        } catch (Exception e) {
            return new AddressDto();
        }
    }
}
