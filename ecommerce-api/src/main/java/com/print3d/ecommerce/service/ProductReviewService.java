package com.print3d.ecommerce.service;

import com.print3d.ecommerce.dto.ProductReviewDto;
import com.print3d.ecommerce.dto.ProductReviewsPageDto;
import com.print3d.ecommerce.model.Order;
import com.print3d.ecommerce.model.Product;
import com.print3d.ecommerce.model.ProductReview;
import com.print3d.ecommerce.model.User;
import com.print3d.ecommerce.repository.OrderRepository;
import com.print3d.ecommerce.repository.ProductRepository;
import com.print3d.ecommerce.repository.ProductReviewRepository;
import com.print3d.ecommerce.repository.SystemParameterRepository;
import com.print3d.ecommerce.repository.UserRepository;
import com.print3d.ecommerce.util.DatePatterns;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
public class ProductReviewService {

    private static final Logger log = LoggerFactory.getLogger(ProductReviewService.class);

    private final ProductReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final SystemParameterRepository systemParameterRepository;
    private final FileStorageService fileStorageService;

    public ProductReviewService(ProductReviewRepository reviewRepository,
                                ProductRepository productRepository,
                                OrderRepository orderRepository,
                                UserRepository userRepository,
                                SystemParameterRepository systemParameterRepository,
                                FileStorageService fileStorageService) {
        this.reviewRepository = reviewRepository;
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.systemParameterRepository = systemParameterRepository;
        this.fileStorageService = fileStorageService;
    }

    public boolean isReviewsEnabled() {
        return systemParameterRepository.findByDescription("Exibir Avaliações na Loja")
                .map(p -> Boolean.parseBoolean(p.getParamValue()))
                .orElse(false);
    }

    public int getMinReviewsRequired() {
        return systemParameterRepository.findByDescription("Mínimo de Avaliações por Produto")
                .map(p -> {
                    try {
                        return Integer.parseInt(p.getParamValue());
                    } catch (Exception e) {
                        return 3;
                    }
                })
                .orElse(3);
    }

    @Transactional(readOnly = true)
    public ProductReviewsPageDto getProductReviewsPublic(UUID productId) {
        boolean enabled = isReviewsEnabled();
        int minRequired = getMinReviewsRequired();
        long count = reviewRepository.countVisibleByProductId(productId);
        Double avg = reviewRepository.getAverageRatingByProductId(productId);
        double roundedAvg = avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0;

        // Se desabilitado globalmente ou se não atingiu o mínimo de avaliações, esconde da vitrine
        if (!enabled || count < minRequired) {
            return ProductReviewsPageDto.builder()
                    .enabled(false)
                    .minReviewsRequired(minRequired)
                    .totalReviews(count)
                    .averageRating(roundedAvg)
                    .reviews(Collections.emptyList())
                    .build();
        }

        List<ProductReviewDto> reviews = reviewRepository.findVisibleByProductId(productId).stream()
                .map(this::toDto)
                .toList();

        return ProductReviewsPageDto.builder()
                .enabled(true)
                .minReviewsRequired(minRequired)
                .totalReviews(count)
                .averageRating(roundedAvg)
                .reviews(reviews)
                .build();
    }

    @Transactional(readOnly = true)
    public List<ProductReviewDto> getMyReviews(UUID userId) {
        return reviewRepository.findByUserId(userId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ProductReviewDto> getAllAdmin() {
        return reviewRepository.findAllWithDetails().stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public ProductReviewDto createReview(UUID userId,
                                         UUID productId,
                                         UUID orderId,
                                         int rating,
                                         String comment,
                                         List<MultipartFile> photos) {
        if (rating < 1 || rating > 5) {
            throw new IllegalArgumentException("A nota deve ser entre 1 e 5 estrelas");
        }

        // Validação estrita: O comprador precisa ter um pedido ENTREGUE contendo este produto
        boolean canReview = reviewRepository.isOrderDeliveredAndContainsProduct(orderId, userId, productId);
        if (!canReview) {
            throw new IllegalStateException("Apenas compradores com pedidos com status ENTREGUE podem avaliar este produto.");
        }

        // Verifica se já avaliou neste pedido
        if (reviewRepository.findByOrderIdAndProductId(orderId, productId).isPresent()) {
            throw new IllegalStateException("Você já enviou uma avaliação para este produto neste pedido.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Produto não encontrado"));
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Pedido não encontrado"));

        List<String> photoUrls = new ArrayList<>();
        if (photos != null && !photos.isEmpty()) {
            int maxPhotos = Math.min(photos.size(), 3);
            for (int i = 0; i < maxPhotos; i++) {
                MultipartFile file = photos.get(i);
                if (file != null && !file.isEmpty()) {
                    try {
                        String url = fileStorageService.storeReviewPhoto(file);
                        photoUrls.add(url);
                    } catch (IOException e) {
                        log.error("Erro ao salvar foto de review", e);
                        throw new RuntimeException("Falha ao salvar fotos da avaliação: " + e.getMessage(), e);
                    }
                }
            }
        }

        ProductReview review = ProductReview.builder()
                .product(product)
                .user(user)
                .order(order)
                .rating(rating)
                .comment(comment != null ? comment.trim() : "")
                .photosUrls(photoUrls)
                .visible(true)
                .build();

        ProductReview saved = reviewRepository.save(review);
        log.info("Nova avaliação registrada para o produto {} no pedido {}", productId, orderId);
        return toDto(saved);
    }

    @Transactional
    public ProductReviewDto replyReviewAdmin(UUID reviewId, String reply) {
        ProductReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Avaliação não encontrada"));

        review.setAdminReply(reply != null && !reply.trim().isEmpty() ? reply.trim() : null);
        review.setAdminRepliedAt(LocalDateTime.now());
        return toDto(reviewRepository.save(review));
    }

    @Transactional
    public ProductReviewDto toggleVisibilityAdmin(UUID reviewId, boolean visible) {
        ProductReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Avaliação não encontrada"));

        review.setVisible(visible);
        return toDto(reviewRepository.save(review));
    }

    @Transactional
    public void deleteReviewAdmin(UUID reviewId) {
        ProductReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Avaliação não encontrada"));

        // Remove fotos do disco
        if (review.getPhotosUrls() != null) {
            for (String photoUrl : review.getPhotosUrls()) {
                fileStorageService.deleteFile(photoUrl);
            }
        }
        reviewRepository.delete(review);
    }

    public ProductReviewDto toDto(ProductReview review) {
        String clientName = review.getUser() != null ? review.getUser().getName() : "Cliente";
        String privacyName = maskName(clientName);

        return ProductReviewDto.builder()
                .id(review.getId() != null ? review.getId().toString() : null)
                .productId(review.getProduct() != null ? review.getProduct().getId().toString() : null)
                .productName(review.getProduct() != null ? review.getProduct().getName() : null)
                .orderId(review.getOrder() != null ? review.getOrder().getId().toString() : null)
                .authorName(privacyName)
                .rating(review.getRating())
                .comment(review.getComment())
                .photosUrls(review.getPhotosUrls() != null ? review.getPhotosUrls() : Collections.emptyList())
                .adminReply(review.getAdminReply())
                .adminRepliedAt(review.getAdminRepliedAt() != null ? review.getAdminRepliedAt().format(DatePatterns.DATE_TIME_FORMATTER) : null)
                .visible(review.isVisible())
                .createdAt(review.getCreatedAt() != null ? review.getCreatedAt().format(DatePatterns.DATE_FORMATTER) : "")
                .build();
    }

    private String maskName(String fullName) {
        if (fullName == null || fullName.trim().isEmpty()) return "Cliente";
        String[] parts = fullName.trim().split("\\s+");
        if (parts.length == 1) return parts[0];
        return parts[0] + " " + parts[parts.length - 1].charAt(0) + ".";
    }
}
