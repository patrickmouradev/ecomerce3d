package com.print3d.ecommerce.util;

import java.time.format.DateTimeFormatter;

public final class DatePatterns {

    public static final String DATE_PATTERN = "dd/MM/yyyy";
    public static final String DATE_TIME_PATTERN = "dd/MM/yyyy HH:mm:ss";

    public static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern(DATE_PATTERN);
    public static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern(DATE_TIME_PATTERN);

    private DatePatterns() {
        throw new UnsupportedOperationException("Classe utilitária não deve ser instanciada");
    }
}
