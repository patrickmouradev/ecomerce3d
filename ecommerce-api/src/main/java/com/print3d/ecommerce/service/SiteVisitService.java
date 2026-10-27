package com.print3d.ecommerce.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.print3d.ecommerce.dto.SiteVisitDashboardDto;
import com.print3d.ecommerce.dto.SiteVisitLogDto;
import com.print3d.ecommerce.dto.SiteVisitTrackRequestDto;
import com.print3d.ecommerce.model.SiteVisitLog;
import com.print3d.ecommerce.model.User;
import com.print3d.ecommerce.repository.SiteVisitLogRepository;
import com.print3d.ecommerce.repository.UserRepository;
import com.print3d.ecommerce.util.DatePatterns;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class SiteVisitService {

    private static final Logger log = LoggerFactory.getLogger(SiteVisitService.class);

    private final SiteVisitLogRepository siteVisitLogRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    // Cache em memória de geolocalização por IP para evitar múltiplas chamadas externas
    private final Map<String, GeoLocationInfo> geoCache = new ConcurrentHashMap<>();

    public SiteVisitService(SiteVisitLogRepository siteVisitLogRepository,
                            UserRepository userRepository,
                            ObjectMapper objectMapper) {
        this.siteVisitLogRepository = siteVisitLogRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(1500))
                .build();
    }

    @Transactional
    public void recordVisit(SiteVisitTrackRequestDto dto, HttpServletRequest request) {
        if (dto == null || dto.getVisitorId() == null || dto.getVisitorId().isBlank()) {
            return;
        }

        String pagePath = dto.getPagePath() != null ? dto.getPagePath().trim() : "/";
        // Não registrar navegação nas telas administrativas
        if (pagePath.startsWith("/admin")) {
            return;
        }

        String ipAddress = extractClientIp(request);
        String userAgent = request.getHeader("User-Agent");
        if (userAgent != null && userAgent.length() > 500) {
            userAgent = userAgent.substring(0, 500);
        }

        String referrer = dto.getReferrer();
        if (referrer != null && referrer.length() > 500) {
            referrer = referrer.substring(0, 500);
        }

        UserAgentInfo uaInfo = parseUserAgent(userAgent);
        GeoLocationInfo geoInfo = resolveGeoLocation(ipAddress);

        UUID userId = null;
        String userName = null;
        String userEmail = null;

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            try {
                UUID parsedId = UUID.fromString(auth.getPrincipal().toString());
                Optional<User> optUser = userRepository.findById(parsedId);
                if (optUser.isPresent()) {
                    User user = optUser.get();
                    userId = user.getId();
                    userName = user.getName();
                    userEmail = user.getEmail();

                    // Vincula acessos anteriores deste mesmo navegador (visitorId) que estavam anônimos
                    siteVisitLogRepository.backfillVisitorIdentity(
                            dto.getVisitorId().trim(),
                            userId,
                            userName,
                            userEmail
                    );
                }
            } catch (Exception ignored) {
            }
        }

        String eventType = (dto.getEventType() != null && !dto.getEventType().isBlank())
                ? dto.getEventType().trim().toUpperCase()
                : "PAGE_VIEW";

        SiteVisitLog visitLog = SiteVisitLog.builder()
                .visitorId(dto.getVisitorId().trim())
                .userId(userId)
                .userName(userName)
                .userEmail(userEmail)
                .ipAddress(ipAddress)
                .city(geoInfo.city)
                .region(geoInfo.region)
                .country(geoInfo.country)
                .isp(geoInfo.isp)
                .deviceType(uaInfo.deviceType)
                .os(uaInfo.os)
                .browser(uaInfo.browser)
                .eventType(eventType)
                .pagePath(pagePath)
                .productId(dto.getProductId())
                .productName(dto.getProductName())
                .referrer(referrer)
                .userAgent(userAgent)
                .build();

        siteVisitLogRepository.save(visitLog);
    }

    @Transactional(readOnly = true)
    public SiteVisitDashboardDto getDashboard(int limit) {
        int safeLimit = Math.min(Math.max(limit, 20), 500);
        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        LocalDateTime fiveMinutesAgo = LocalDateTime.now().minusMinutes(5);

        long activeLast5Min = siteVisitLogRepository.countDistinctVisitorsSince(fiveMinutesAgo);
        long uniqueToday = siteVisitLogRepository.countDistinctVisitorsSince(startOfToday);
        long eventsToday = siteVisitLogRepository.countByCreatedAtAfter(startOfToday);
        long uniqueTotal = siteVisitLogRepository.countTotalDistinctVisitors();
        long identifiedTotal = siteVisitLogRepository.countTotalIdentifiedUsers();

        List<Object[]> topProductsRaw = siteVisitLogRepository.findTopViewedProducts(PageRequest.of(0, 8));
        List<Map<String, Object>> topProducts = new ArrayList<>();
        for (Object[] row : topProductsRaw) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("productName", row[0]);
            item.put("totalViews", row[1]);
            item.put("uniqueViewers", row[2]);
            topProducts.add(item);
        }

        List<SiteVisitLogDto> recentLogs = siteVisitLogRepository
                .findAllByOrderByCreatedAtDesc(PageRequest.of(0, safeLimit))
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());

        return SiteVisitDashboardDto.builder()
                .activeVisitorsLast5Min(activeLast5Min)
                .uniqueVisitorsToday(uniqueToday)
                .totalEventsToday(eventsToday)
                .uniqueVisitorsTotal(uniqueTotal)
                .identifiedUsersTotal(identifiedTotal)
                .topProductsViewed(topProducts)
                .recentLogs(recentLogs)
                .build();
    }

    @Transactional
    public void clearAllLogs() {
        siteVisitLogRepository.deleteAllInBatch();
    }

    private SiteVisitLogDto toDto(SiteVisitLog entity) {
        return SiteVisitLogDto.builder()
                .id(entity.getId())
                .visitorId(entity.getVisitorId())
                .userId(entity.getUserId())
                .userName(entity.getUserName())
                .userEmail(entity.getUserEmail())
                .ipAddress(entity.getIpAddress())
                .city(entity.getCity())
                .region(entity.getRegion())
                .country(entity.getCountry())
                .isp(entity.getIsp())
                .deviceType(entity.getDeviceType())
                .os(entity.getOs())
                .browser(entity.getBrowser())
                .eventType(entity.getEventType())
                .pagePath(entity.getPagePath())
                .productId(entity.getProductId())
                .productName(entity.getProductName())
                .referrer(entity.getReferrer())
                .createdAt(entity.getCreatedAt() != null
                        ? entity.getCreatedAt().format(DatePatterns.DATE_TIME_FORMATTER)
                        : "")
                .build();
    }

    private String extractClientIp(HttpServletRequest request) {
        String[] headersToCheck = {
                "CF-Connecting-IP",
                "X-Forwarded-For",
                "X-Real-IP",
                "Forwarded"
        };
        for (String header : headersToCheck) {
            String value = request.getHeader(header);
            if (value != null && !value.isBlank() && !"unknown".equalsIgnoreCase(value)) {
                String firstIp = value.split(",")[0].trim();
                if (!firstIp.isBlank()) {
                    return firstIp;
                }
            }
        }
        return request.getRemoteAddr();
    }

    private GeoLocationInfo resolveGeoLocation(String ip) {
        if (ip == null || ip.isBlank() || isPrivateOrLocalIp(ip)) {
            return new GeoLocationInfo("Rede Local", "Local", "Brasil", "Rede Interna / Docker");
        }

        GeoLocationInfo cached = geoCache.get(ip);
        if (cached != null) {
            return cached;
        }

        try {
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create("http://ip-api.com/json/" + ip.trim() + "?fields=status,country,regionName,city,isp&lang=pt-BR"))
                    .timeout(Duration.ofMillis(1500))
                    .GET()
                    .build();

            HttpResponse<String> res = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() == 200 && res.body() != null) {
                JsonNode node = objectMapper.readTree(res.body());
                if ("success".equalsIgnoreCase(node.path("status").asText())) {
                    GeoLocationInfo info = new GeoLocationInfo(
                            node.path("city").asText("Não identificado"),
                            node.path("regionName").asText(""),
                            node.path("country").asText("Brasil"),
                            node.path("isp").asText("")
                    );
                    if (geoCache.size() < 5000) {
                        geoCache.put(ip, info);
                    }
                    return info;
                }
            }
        } catch (Exception e) {
            log.debug("Não foi possível consultar GeoIP para {}: {}", ip, e.getMessage());
        }

        GeoLocationInfo fallback = new GeoLocationInfo("Não identificado", "", "", "");
        if (geoCache.size() < 5000) {
            geoCache.put(ip, fallback);
        }
        return fallback;
    }

    private boolean isPrivateOrLocalIp(String ip) {
        return ip.equals("127.0.0.1")
                || ip.equals("0:0:0:0:0:0:0:1")
                || ip.equals("::1")
                || ip.startsWith("10.")
                || ip.startsWith("192.168.")
                || ip.startsWith("172.16.")
                || ip.startsWith("172.17.")
                || ip.startsWith("172.18.")
                || ip.startsWith("172.19.")
                || ip.startsWith("172.2")
                || ip.startsWith("172.30.")
                || ip.startsWith("172.31.");
    }

    private UserAgentInfo parseUserAgent(String ua) {
        if (ua == null || ua.isBlank()) {
            return new UserAgentInfo("Desconhecido", "Desconhecido", "Desconhecido");
        }
        String lower = ua.toLowerCase();

        // Tipo de Dispositivo
        String deviceType = "Computador";
        if (lower.contains("bot") || lower.contains("crawl") || lower.contains("spider") || lower.contains("slurp")) {
            deviceType = "Bot / Crawler";
        } else if (lower.contains("ipad") || lower.contains("tablet")) {
            deviceType = "Tablet";
        } else if (lower.contains("mobi") || lower.contains("android") || lower.contains("iphone")) {
            deviceType = "Celular";
        }

        // Sistema Operacional
        String os = "Outro";
        if (lower.contains("iphone") || lower.contains("ipad") || lower.contains("ipod")) {
            os = "iOS (iPhone/iPad)";
        } else if (lower.contains("android")) {
            os = "Android";
        } else if (lower.contains("windows")) {
            os = "Windows";
        } else if (lower.contains("mac os") || lower.contains("macintosh")) {
            os = "macOS";
        } else if (lower.contains("linux")) {
            os = "Linux";
        }

        // Navegador / Origem In-App
        String browser = "Outro";
        if (lower.contains("instagram")) {
            browser = "Instagram App";
        } else if (lower.contains("whatsapp")) {
            browser = "WhatsApp";
        } else if (lower.contains("fban") || lower.contains("fbav")) {
            browser = "Facebook App";
        } else if (lower.contains("edg/") || lower.contains("edga/") || lower.contains("edgios/")) {
            browser = "Edge";
        } else if (lower.contains("opr/") || lower.contains("opera")) {
            browser = "Opera";
        } else if (lower.contains("chrome/") || lower.contains("crios/")) {
            browser = "Chrome";
        } else if (lower.contains("firefox/") || lower.contains("fxios/")) {
            browser = "Firefox";
        } else if (lower.contains("safari/")) {
            browser = "Safari";
        }

        return new UserAgentInfo(deviceType, os, browser);
    }

    private record GeoLocationInfo(String city, String region, String country, String isp) {}
    private record UserAgentInfo(String deviceType, String os, String browser) {}
}
