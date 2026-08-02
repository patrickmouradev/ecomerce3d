package com.print3d.ecommerce.util;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.NumberFormat;
import java.util.Locale;

public final class CalculationUtils {

    private static final Locale PT_BR = Locale.forLanguageTag("pt-BR");

    private CalculationUtils() {
        throw new UnsupportedOperationException("Classe utilitária não deve ser instanciada");
    }

    /**
     * Formata um valor BigDecimal no padrão de moeda brasileiro (R$ 1.000,25)
     */
    public static String formatCurrency(BigDecimal value) {
        if (value == null) {
            return "R$ 0,00";
        }
        NumberFormat currencyFormat = NumberFormat.getCurrencyInstance(PT_BR);
        return currencyFormat.format(value);
    }

    /**
     * Formata um valor Double no padrão de moeda brasileiro
     */
    public static String formatCurrency(Double value) {
        if (value == null) {
            return "R$ 0,00";
        }
        return formatCurrency(BigDecimal.valueOf(value));
    }

    /**
     * Arredonda um BigDecimal para duas casas decimais
     */
    public static BigDecimal roundValue(BigDecimal value) {
        if (value == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return value.setScale(2, RoundingMode.HALF_UP);
    }
}
