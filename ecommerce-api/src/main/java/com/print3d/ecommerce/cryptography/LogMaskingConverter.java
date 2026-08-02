package com.print3d.ecommerce.cryptography;

import ch.qos.logback.classic.pattern.ClassicConverter;
import ch.qos.logback.classic.spi.ILoggingEvent;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class LogMaskingConverter extends ClassicConverter {

    // Regex para CPF (com ou sem pontuação)
    private static final Pattern CPF_PATTERN = Pattern.compile("\\b(\\d{3})\\.?(\\d{3})\\.?(\\d{3})-?(\\d{2})\\b");
    
    // Regex para e-mail
    private static final Pattern EMAIL_PATTERN = Pattern.compile("\\b([a-zA-Z0-9_.+-]{1,3})([a-zA-Z0-9_.+-]*)@([a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+)\\b");

    @Override
    public String convert(ILoggingEvent event) {
        String message = event.getFormattedMessage();
        if (message == null || message.isEmpty()) {
            return message;
        }
        
        // Aplicar máscara no CPF
        message = maskCpf(message);
        
        // Aplicar máscara no E-mail
        message = maskEmail(message);

        return message;
    }

    private String maskCpf(String message) {
        Matcher matcher = CPF_PATTERN.matcher(message);
        StringBuilder sb = new StringBuilder();
        while (matcher.find()) {
            String firstThree = matcher.group(1);
            // Mascara com base no padrão: somente 3 primeiros dígitos visíveis, restante com *
            // CPF original com pontuação: 123.456.789-00 -> 123.***.***-**
            // CPF original sem pontuação: 12345678900 -> 123********
            boolean hasFormat = matcher.group().contains(".");
            String replacement;
            if (hasFormat) {
                replacement = firstThree + ".***.***-**";
            } else {
                replacement = firstThree + "********";
            }
            matcher.appendReplacement(sb, replacement);
        }
        matcher.appendTail(sb);
        return sb.toString();
    }

    private String maskEmail(String message) {
        Matcher matcher = EMAIL_PATTERN.matcher(message);
        StringBuilder sb = new StringBuilder();
        while (matcher.find()) {
            String prefix = matcher.group(1);
            String restPrefix = matcher.group(2);
            String domain = matcher.group(3);
            
            String maskedRest = "*".repeat(restPrefix.length());
            String replacement = prefix + maskedRest + "@" + domain;
            matcher.appendReplacement(sb, replacement);
        }
        matcher.appendTail(sb);
        return sb.toString();
    }
}
