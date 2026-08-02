package com.print3d.ecommerce.service;

import com.print3d.ecommerce.dto.SalesReportRowDto;
import com.print3d.ecommerce.model.Order;
import com.print3d.ecommerce.repository.OrderRepository;
import com.print3d.ecommerce.util.DatePatterns;
import net.sf.jasperreports.engine.*;
import net.sf.jasperreports.engine.data.JRBeanCollectionDataSource;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ReportService {

    private final OrderRepository orderRepository;

    public ReportService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    /**
     * Gera o PDF compilado do relatório de vendas
     */
    @Transactional(readOnly = true)
    public byte[] generateSalesReportPdf(String loggedUserName) {
        try {
            // 1. Carrega o template jrxml de resources
            InputStream reportStream = new ClassPathResource("reports/sales-report.jrxml").getInputStream();
            
            // 2. Compila o relatório Jasper
            JasperReport jasperReport = JasperCompileManager.compileReport(reportStream);

            // 3. Consulta as vendas no banco de dados
            List<Order> orders = orderRepository.findAllOrdersWithUsers();
            
            // Mapeia para os DTOs do relatório
            List<SalesReportRowDto> reportData = orders.stream()
                    .map(o -> SalesReportRowDto.builder()
                            .orderId(o.getId().toString())
                            .clientName(o.getUser().getName())
                            .status(o.getStatus())
                            .totalAmount(o.getTotalAmount().doubleValue())
                            .createdAt(o.getCreatedAt().format(DatePatterns.DATE_FORMATTER))
                            .build())
                    .toList();

            // 4. Cria o DataSource do Jasper
            JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(reportData);

            // 5. Configura parâmetros do relatório
            Map<String, Object> parameters = new HashMap<>();
            parameters.put("ReportTitle", "Relatório Consolidado de Vendas");
            parameters.put("LoggedUser", loggedUserName);

            // 6. Preenche o relatório
            JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parameters, dataSource);

            // 7. Exporta para array de bytes PDF
            return JasperExportManager.exportReportToPdf(jasperPrint);

        } catch (Exception e) {
            throw new RuntimeException("Erro ao gerar relatório PDF com JasperReports", e);
        }
    }
}
