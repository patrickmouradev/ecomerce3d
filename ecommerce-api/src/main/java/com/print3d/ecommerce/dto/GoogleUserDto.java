package com.print3d.ecommerce.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class GoogleUserDto {

    private String sub;
    private String email;
    private String name;

    @JsonProperty("email_verified")
    private String emailVerified;

    public boolean isEmailVerified() {
        return "true".equalsIgnoreCase(emailVerified);
    }
}
