package com.print3d.ecommerce.service;

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
