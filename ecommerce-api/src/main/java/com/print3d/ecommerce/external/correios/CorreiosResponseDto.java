package com.print3d.ecommerce.external.correios;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CorreiosResponseDto {
    private BigDecimal valorFrete;
    private int prazoEntregaDias;
    private String erro;
}
