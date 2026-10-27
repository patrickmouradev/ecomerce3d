package com.print3d.ecommerce.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_site_visit_log")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SiteVisitLog {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "visitor_id", nullable = false, length = 64)
    private String visitorId;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "user_name", length = 255)
    private String userName;

    @Column(name = "user_email", length = 255)
    private String userEmail;

    @Column(name = "ip_address", length = 64)
    private String ipAddress;

    @Column(name = "city", length = 120)
    private String city;

    @Column(name = "region", length = 120)
    private String region;

    @Column(name = "country", length = 120)
    private String country;

    @Column(name = "isp", length = 180)
    private String isp;

    @Column(name = "device_type", length = 50)
    private String deviceType;

    @Column(name = "os", length = 80)
    private String os;

    @Column(name = "browser", length = 80)
    private String browser;

    @Column(name = "event_type", nullable = false, length = 50)
    private String eventType; // PAGE_VIEW, PRODUCT_VIEW, ADD_TO_CART

    @Column(name = "page_path", nullable = false, length = 255)
    private String pagePath;

    @Column(name = "product_id")
    private UUID productId;

    @Column(name = "product_name", length = 255)
    private String productName;

    @Column(name = "referrer", length = 500)
    private String referrer;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
