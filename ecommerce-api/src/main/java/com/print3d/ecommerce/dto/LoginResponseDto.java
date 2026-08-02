package com.print3d.ecommerce.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class LoginResponseDto {
    private String token;
    private String name;
    private String email;
    private String activeRole;
    private List<String> roles;
}
