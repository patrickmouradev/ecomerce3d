package com.print3d.ecommerce.controller;

import com.print3d.ecommerce.dto.SiteVisitDashboardDto;
import com.print3d.ecommerce.dto.SiteVisitTrackRequestDto;
import com.print3d.ecommerce.service.SiteVisitService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
public class SiteVisitController {

    private final SiteVisitService siteVisitService;

    public SiteVisitController(SiteVisitService siteVisitService) {
        this.siteVisitService = siteVisitService;
    }

    /**
     * Endpoint público chamado pelo front-end para registrar páginas e produtos visitados.
     * Se o visitante estiver autenticado (header Authorization presente), vincula automaticamente ao usuário.
     */
    @PostMapping("/api/analytics/track")
    public ResponseEntity<Void> trackVisit(@RequestBody SiteVisitTrackRequestDto dto,
                                           HttpServletRequest request) {
        siteVisitService.recordVisit(dto, request);
        return ResponseEntity.ok().build();
    }

    /**
     * Endpoint restrito ao Admin/Financeiro para consultar métricas e logs detalhados de quem acessou o site.
     */
    @GetMapping("/api/admin/analytics/visits")
    public ResponseEntity<SiteVisitDashboardDto> getVisitsDashboard(
            @RequestParam(defaultValue = "150") int limit) {
        return ResponseEntity.ok(siteVisitService.getDashboard(limit));
    }

    /**
     * Permite ao Admin limpar o histórico de logs de acesso se desejar.
     */
    @DeleteMapping("/api/admin/analytics/visits")
    public ResponseEntity<Void> clearVisitsHistory() {
        siteVisitService.clearAllLogs();
        return ResponseEntity.noContent().build();
    }
}
