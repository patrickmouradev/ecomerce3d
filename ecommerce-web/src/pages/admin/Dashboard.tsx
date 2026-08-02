import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { ArrowUpDown, Loader, Download, TrendingUp, CheckCircle, Clock } from 'lucide-react';

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  clientName: string;
  status: string; // PENDENTE, PAGO, ENVIADO, CANCELADO
  shippingCost: number;
  totalAmount: number;
  mercadoPagoPaymentId: string;
  trackingCode: string;
  createdAt: string;
  items: OrderItem[];
}

export const Dashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Ordenação
  const [sortBy, setSortBy] = useState('createdAt');
  const [direction, setDirection] = useState('desc');

  const [downloadingReport, setDownloadingReport] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [sortBy, direction]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/orders');
      setOrders(response.data);
    } catch (e) {
      console.error("Erro ao buscar vendas", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setDirection(direction === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setDirection('asc');
    }
  };

  const handleDownloadReport = async () => {
    setDownloadingReport(true);
    try {
      const response = await api.get('/api/admin/orders/report', {
        responseType: 'blob' // Necessário para processar arquivos de download binário
      });

      // Cria um link temporário para download do PDF
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'relatorio_vendas_3DPrintPNG.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error("Erro ao baixar relatório em PDF", e);
      alert("Falha ao gerar e baixar relatório consolidado em PDF.");
    } finally {
      setDownloadingReport(false);
    }
  };

  // Métricas do Dashboard
  const totalVendas = orders.reduce((sum, o) => sum + (o.status === 'PAGO' || o.status === 'ENVIADO' ? o.totalAmount : 0), 0);
  const totalPedidos = orders.length;
  const pedidosPendentes = orders.filter(o => o.status === 'PENDENTE').length;

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Topo da Tela */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)' }}>Painel de Vendas</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Acompanhamento financeiro e status de entregas da 3DPrintPNG</p>
        </div>
        
        {/* Botão de Exportar PDF com Jasper Reports */}
        <button 
          className="btn btn-primary" 
          onClick={handleDownloadReport} 
          disabled={downloadingReport}
          style={{ display: 'inline-flex', gap: '0.5rem' }}
        >
          {downloadingReport ? (
            <Loader className="animate-spin" size={16} />
          ) : (
            <Download size={16} />
          )}
          Exportar Relatório PDF (Jasper)
        </button>
      </div>

      {/* Cards de Métricas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.5rem',
        marginBottom: '3rem'
      }}>
        {/* Faturamento */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'var(--success-glow)', color: 'var(--success)', padding: '0.75rem', borderRadius: '50%' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>Receita Total (Paga)</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>
              {totalVendas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
        </div>

        {/* Quantidade de Pedidos */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'var(--primary-glow)', color: 'var(--primary)', padding: '0.75rem', borderRadius: '50%' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>Total de Pedidos</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>{totalPedidos}</span>
          </div>
        </div>

        {/* Pedidos Pendentes */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(255, 183, 0, 0.1)', color: 'var(--warning)', padding: '0.75rem', borderRadius: '50%' }}>
            <Clock size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>Pedidos Pendentes</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>{pedidosPendentes}</span>
          </div>
        </div>
      </div>

      {/* Listagem de Vendas */}
      <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', marginBottom: '1.25rem' }}>Histórico de Vendas Recentes</h3>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader className="animate-spin" size={24} style={{ color: 'var(--primary)' }} />
        </div>
      ) : orders.length > 0 ? (
        <div className="table-container">
          <table className="premium-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('id')}>
                  ID Pedido <ArrowUpDown size={12} style={{ marginLeft: '0.25rem' }} />
                </th>
                <th>Cliente</th>
                <th onClick={() => handleSort('createdAt')}>
                  Data da Venda <ArrowUpDown size={12} style={{ marginLeft: '0.25rem' }} />
                </th>
                <th>Status</th>
                <th>Frete</th>
                <th onClick={() => handleSort('totalAmount')}>
                  Total <ArrowUpDown size={12} style={{ marginLeft: '0.25rem' }} />
                </th>
                <th>Transação (MP)</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>#{order.id.substring(0, 8)}</td>
                  <td style={{ fontWeight: 600 }}>{order.clientName}</td>
                  <td>{order.createdAt}</td>
                  <td>
                    <span style={{
                      padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700,
                      background: order.status === 'PAGO' || order.status === 'ENVIADO' ? 'var(--success-glow)' : 'rgba(255, 183, 0, 0.1)',
                      color: order.status === 'PAGO' || order.status === 'ENVIADO' ? 'var(--success)' : 'var(--warning)',
                      border: `1px solid ${order.status === 'PAGO' || order.status === 'ENVIADO' ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 183, 0, 0.2)'}`
                    }}>
                      {order.status}
                    </span>
                  </td>
                  <td>{order.shippingCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  <td style={{ fontWeight: 700, color: '#fff' }}>
                    {order.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {order.mercadoPagoPaymentId || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
          Nenhuma transação registrada no sistema ainda.
        </div>
      )}
    </div>
  );
};
export default Dashboard;
