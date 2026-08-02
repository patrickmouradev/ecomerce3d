package com.print3d.ecommerce.util;

public final class PdfValidator {

    private PdfValidator() {
        throw new UnsupportedOperationException("Classe utilitária não deve ser instanciada");
    }

    /**
     * Valida se um array de bytes corresponde a um documento PDF através da assinatura mágica
     */
    public static boolean isValidPdf(byte[] pdfBytes) {
        if (pdfBytes == null || pdfBytes.length < 4) {
            return false;
        }
        // Assinatura mágica do PDF: %PDF (hex: 25 50 44 46)
        return pdfBytes[0] == 0x25 && // '%'
               pdfBytes[1] == 0x50 && // 'P'
               pdfBytes[2] == 0x44 && // 'D'
               pdfBytes[3] == 0x46;   // 'F'
    }
}
