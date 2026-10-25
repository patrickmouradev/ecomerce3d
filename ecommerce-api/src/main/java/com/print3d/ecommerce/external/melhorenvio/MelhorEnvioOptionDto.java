package com.print3d.ecommerce.external.melhorenvio;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MelhorEnvioOptionDto {
    private Integer id;
    private String nome;
    private String transportadora;
    private String logoUrl;
    private BigDecimal valor;
    private int prazoDias;
}
