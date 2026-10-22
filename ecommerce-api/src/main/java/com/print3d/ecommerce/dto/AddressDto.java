package com.print3d.ecommerce.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddressDto {
    private String zipCode;      // CEP (apenas números ou formatado)
    private String streetName;   // Rua / Logradouro
    private String streetNumber; // Número
    private String complement;   // Complemento (opcional)
    private String neighborhood; // Bairro
    private String city;         // Cidade
    private String federalUnit;  // UF (ex: SP, RJ, MG)
    private String phone;        // Telefone / WhatsApp com DDD
}
