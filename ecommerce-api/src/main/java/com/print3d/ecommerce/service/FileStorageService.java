package com.print3d.ecommerce.service;

import com.print3d.ecommerce.util.PdfValidator;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.*;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final Logger log = LoggerFactory.getLogger(FileStorageService.class);

    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList(
            ".jpg", ".jpeg", ".png", ".webp", ".mp4", ".gif"
    );

    private static final List<String> ALLOWED_CHAT_EXTENSIONS = Arrays.asList(
            ".jpg", ".jpeg", ".png", ".webp", ".pdf"
    );

    private static final long MAX_CHAT_FILE_SIZE_BYTES = 10L * 1024L * 1024L; // 10 MB

    @Value("${app.upload.dir}")
    private String uploadDir;

    private Path rootLocation;

    @PostConstruct
    public void init() {
        try {
            this.rootLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(this.rootLocation);
            Files.createDirectories(this.rootLocation.resolve("products"));
            Files.createDirectories(this.rootLocation.resolve("banners"));
            Files.createDirectories(this.rootLocation.resolve("chat"));
            Files.createDirectories(this.rootLocation.resolve("reviews"));
            log.info("Diretório de upload inicializado com sucesso em: {}", this.rootLocation);
        } catch (IOException e) {
            log.error("Não foi possível inicializar o diretório de uploads: {}", uploadDir, e);
            throw new RuntimeException("Falha ao inicializar o armazenamento de arquivos em " + uploadDir, e);
        }
    }

    /**
     * Armazena fisicamente o arquivo recebido em disco no subdiretório especificado
     * (ex: "products", "banners") e retorna a URL relativa ("/uploads/{subDir}/{filename}").
     */
    public String storeFile(MultipartFile file, String subDirectory) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("O arquivo de upload não pode estar vazio.");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            originalFilename = "file";
        }
        originalFilename = StringUtils.cleanPath(originalFilename);

        String extension = "";
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex >= 0) {
            extension = originalFilename.substring(dotIndex).toLowerCase();
        }

        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException(
                    "Tipo de arquivo não permitido. Extensões aceitas: " + String.join(", ", ALLOWED_EXTENSIONS)
            );
        }

        // Subdiretório seguro (sem path traversal)
        String cleanSubDir = subDirectory != null ? subDirectory.replaceAll("[^a-zA-Z0-9_-]", "") : "products";
        Path targetDir = this.rootLocation.resolve(cleanSubDir).normalize();
        if (!targetDir.startsWith(this.rootLocation)) {
            throw new SecurityException("Tentativa de acesso a diretório fora da raiz de uploads.");
        }
        Files.createDirectories(targetDir);

        // Gera nome único com UUID para evitar conflitos de sobrescrita
        String uniqueFilename = UUID.randomUUID() + extension;
        Path destination = targetDir.resolve(uniqueFilename).normalize();

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, destination, StandardCopyOption.REPLACE_EXISTING);
        }

        log.info("Arquivo gravado com sucesso: {}", destination);
        return "/uploads/" + cleanSubDir + "/" + uniqueFilename;
    }

    /**
     * Armazena um anexo do chat do pedido (foto ou PDF) em /uploads/chat/{uuid}.{ext},
     * validando tamanho máximo (10 MB), extensão e assinatura mágica para PDF.
     */
    public String storeChatAttachment(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("O anexo enviado está vazio.");
        }

        if (file.getSize() > MAX_CHAT_FILE_SIZE_BYTES) {
            throw new IllegalArgumentException("O arquivo excede o tamanho máximo permitido de 10 MB.");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            originalFilename = "anexo";
        }
        originalFilename = StringUtils.cleanPath(originalFilename);

        String extension = "";
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex >= 0) {
            extension = originalFilename.substring(dotIndex).toLowerCase();
        }

        if (!ALLOWED_CHAT_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException(
                    "Formato não suportado no chat. Envie uma imagem (JPG, PNG, WEBP) ou documento PDF."
            );
        }

        byte[] fileBytes = file.getBytes();
        if (".pdf".equals(extension) && !PdfValidator.isValidPdf(fileBytes)) {
            throw new IllegalArgumentException("O arquivo enviado não é um documento PDF válido.");
        }

        Path targetDir = this.rootLocation.resolve("chat").normalize();
        if (!targetDir.startsWith(this.rootLocation)) {
            throw new SecurityException("Tentativa de acesso a diretório fora da raiz de uploads.");
        }
        Files.createDirectories(targetDir);

        String uniqueFilename = UUID.randomUUID() + extension;
        Path destination = targetDir.resolve(uniqueFilename).normalize();

        Files.write(destination, fileBytes, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);

        log.info("Anexo do chat gravado com sucesso: {}", destination);
        return "/uploads/chat/" + uniqueFilename;
    }

    /**
     * Armazena fotos anexadas a uma avaliação de produto em /uploads/reviews/{uuid}.{ext}.
     * Aceita apenas imagens (JPG, PNG, WEBP) de até 10 MB.
     */
    public String storeReviewPhoto(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("A foto enviada está vazia.");
        }

        if (file.getSize() > MAX_CHAT_FILE_SIZE_BYTES) {
            throw new IllegalArgumentException("A foto excede o tamanho máximo de 10 MB.");
        }

        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "review.jpg";
        String extension = "";
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex >= 0) {
            extension = originalFilename.substring(dotIndex).toLowerCase();
        }

        if (!Arrays.asList(".jpg", ".jpeg", ".png", ".webp").contains(extension)) {
            throw new IllegalArgumentException("Apenas imagens (JPG, PNG, WEBP) são aceitas nas avaliações.");
        }

        Path targetDir = this.rootLocation.resolve("reviews").normalize();
        Files.createDirectories(targetDir);

        String uniqueFilename = UUID.randomUUID() + extension;
        Path destination = targetDir.resolve(uniqueFilename).normalize();

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, destination, StandardCopyOption.REPLACE_EXISTING);
        }

        log.info("Foto de avaliação salva com sucesso: {}", destination);
        return "/uploads/reviews/" + uniqueFilename;
    }

    /**
     * Exclui fisicamente o arquivo correspondente à URL relativa informada (ex: "/uploads/products/xyz.jpg").
     */
    public boolean deleteFile(String fileUrl) {
        if (fileUrl == null || !fileUrl.startsWith("/uploads/")) {
            return false;
        }

        try {
            String relativePart = fileUrl.substring("/uploads/".length());
            Path targetFile = this.rootLocation.resolve(relativePart).normalize();

            // Proteção contra Directory Traversal
            if (!targetFile.startsWith(this.rootLocation)) {
                log.warn("Tentativa de exclusão com path traversal bloqueada: {}", fileUrl);
                return false;
            }

            if (Files.exists(targetFile)) {
                boolean deleted = Files.deleteIfExists(targetFile);
                log.info("Arquivo removido: {} (sucesso={})", targetFile, deleted);
                return deleted;
            }
        } catch (Exception e) {
            log.warn("Erro ao tentar remover arquivo {}: {}", fileUrl, e.getMessage());
        }
        return false;
    }

    public Path getRootLocation() {
        return rootLocation;
    }
}
