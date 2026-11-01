import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import OrderChatBox from '../../components/OrderChatBox';
import {
  ArrowUpDown,
  Loader,
  Download,
  TrendingUp,
  CheckCircle,
  Clock,
  MessageSquare,
  X,
  MapPin,
  Truck,
  Save,
  Activity,
  Layers,
  Box,
  Package,
  CheckCheck,
  XCircle
} from 'lucide-react';

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  price: number;
}

interface AddressDto {
  zipCode: string;
  streetName: string;
  streetNumber: string;
  complement?: string;
  neighborhood: string;
  city: string;
  federalUnit: string;
  phone?: string;
}

interface Order {
  id: string;
  orderNumber?: number;
  clientName: string;
  clientEmail?: string;
  customerPhone?: string;
  status: string; // PENDENTE, PAGO, AGUARDANDO RETIRADA, ENVIADO, ENTREGUE, CANCELADO
  shippingCost: number;
  totalAmount: number;
  trackingCode: string;
  shippingAddress?: AddressDto;
  createdAt: string;
  unreadBuyerMessages?: number;
  items: OrderItem[];
}

export const Dashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const orderIdParam = searchParams.get('orderId');
  const autoOpenedOrderRef = useRef<string | null>(null);

  // Ordenação
  const [sortBy, setSortBy] = useState('createdAt');
  const [direction, setDirection] = useState('desc');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const [downloadingReport, setDownloadingReport] = useState(false);

  // Modal de Atendimento / Chat PIX do Pedido
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editStatus, setEditStatus] = useState<string>('PENDENTE');
  const [editTrackingCode, setEditTrackingCode] = useState<string>('');
  const [savingOrderUpdate, setSavingOrderUpdate] = useState(false);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => {
      fetchOrders(true);
    }, 8000);
    return () => clearInterval(interval);
  }, [sortBy, direction]);

  useEffect(() => {
    if (orderIdParam && orders.length > 0 && autoOpenedOrderRef.current !== orderIdParam) {
      const targetOrder = orders.find((o) => o.id === orderIdParam);
      if (targetOrder) {
        autoOpenedOrderRef.current = orderIdParam;
        handleOpenOrderChat(targetOrder);
      }
    }
  }, [orderIdParam, orders]);

  const fetchOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await api.get('/api/admin/orders');
      setOrders(response.data);
    } catch (e) {
      console.error('Erro ao buscar vendas', e);
    } finally {
      if (!silent) setLoading(false);
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

  const handleOpenOrderChat = (order: Order) => {
    setSelectedOrder({ ...order, unreadBuyerMessages: 0 });
    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, unreadBuyerMessages: 0 } : o))
    );
    setEditStatus(order.status || 'PENDENTE');
    setEditTrackingCode(order.trackingCode || '');
  };

  const handleSaveOrderDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setSavingOrderUpdate(true);
    try {
      const res = await api.patch(`/api/admin/orders/${selectedOrder.id}`, {
        status: editStatus,
        trackingCode: editTrackingCode.trim()
      });
      const updatedOrder: Order = res.data;
      setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
      setSelectedOrder(updatedOrder);
    } catch (err) {
      console.error('Erro ao atualizar status/rastreio do pedido', err);
      alert('Falha ao atualizar status ou código de rastreio do pedido.');
    } finally {
      setSavingOrderUpdate(false);
    }
  };

  const handleDownloadReport = async () => {
    setDownloadingReport(true);
    try {
      const response = await api.get('/api/admin/orders/report', {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'relatorio_vendas_3DPrintPNG.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error('Erro ao baixar relatório em PDF', e);
      alert('Falha ao gerar e baixar relatório consolidado em PDF.');
    } finally {
      setDownloadingReport(false);
    }
  };

  // Métricas do Dashboard
  const isPaidOrderStatus = (status: string) =>
    status === 'PAGO' ||
    status === 'AGUARDANDO RETIRADA' ||
    status === 'AGUARDANDO ENVIO' ||
    status === 'ENVIADO' ||
    status === 'ENTREGUE';

  const totalVendas = orders.reduce(
    (sum, o) => sum + (isPaidOrderStatus(o.status) ? o.totalAmount : 0),
    0
  );
  const totalPedidos = orders.length;

  const countPending = orders.filter((o) => o.status === 'PENDENTE').length;
  const countPaid = orders.filter((o) => o.status === 'PAGO').length;
  const countAwaitingPickup = orders.filter((o) => o.status === 'AGUARDANDO RETIRADA').length;
  const countAwaitingShipping = orders.filter((o) => o.status === 'AGUARDANDO ENVIO').length;
  const countCompleted = orders.filter((o) => o.status === 'ENVIADO' || o.status === 'ENTREGUE').length;
  const countCancelled = orders.filter((o) => o.status === 'CANCELADO').length;

  const filteredOrders = orders.filter((order) => {
    if (!statusFilter || statusFilter === 'TODOS') return true;
    if (statusFilter === 'CONCLUIDO') {
      return order.status === 'ENVIADO' || order.status === 'ENTREGUE';
    }
    return order.status === statusFilter;
  });

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'PENDENTE':
        return {
          bg: 'rgba(255, 183, 0, 0.12)',
          color: 'var(--warning)',
          border: '1px solid rgba(255, 183, 0, 0.3)'
        };
      case 'PAGO':
        return {
          bg: 'rgba(56, 189, 248, 0.15)',
          color: '#38bdf8',
          border: '1px solid rgba(56, 189, 248, 0.35)'
        };
      case 'AGUARDANDO RETIRADA':
        return {
          bg: 'rgba(192, 132, 252, 0.15)',
          color: '#c084fc',
          border: '1px solid rgba(192, 132, 252, 0.35)'
        };
      case 'AGUARDANDO ENVIO':
        return {
          bg: 'rgba(251, 146, 60, 0.15)',
          color: '#fb923c',
          border: '1px solid rgba(251, 146, 60, 0.35)'
        };
      case 'ENVIADO':
      case 'ENTREGUE':
        return {
          bg: 'var(--success-glow)',
          color: 'var(--success)',
          border: '1px solid rgba(0, 255, 136, 0.3)'
        };
      case 'CANCELADO':
        return {
          bg: 'rgba(248, 113, 113, 0.15)',
          color: '#f87171',
          border: '1px solid rgba(248, 113, 113, 0.35)'
        };
      default:
        return {
          bg: 'rgba(255, 255, 255, 0.08)',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border-color)'
        };
    }
  };

  const statusCards = [
    {
      key: 'TODOS',
      label: 'Todos',
      sublabel: 'Visão Geral',
      count: totalPedidos,
      icon: Layers,
      color: 'var(--primary)',
      glow: 'var(--primary-glow)'
    },
    {
      key: 'PENDENTE',
      label: 'Aguardando PIX',
      sublabel: 'Pendentes',
      count: countPending,
      icon: Clock,
      color: 'var(--warning)',
      glow: 'rgba(255, 183, 0, 0.2)'
    },
    {
      key: 'PAGO',
      label: 'Pago',
      sublabel: 'Em Produção 3D',
      count: countPaid,
      icon: Box,
      color: '#38bdf8',
      glow: 'rgba(56, 189, 248, 0.2)'
    },
    {
      key: 'AGUARDANDO RETIRADA',
      label: 'Aguardando Retirada',
      sublabel: 'Pronto no Balcão',
      count: countAwaitingPickup,
      icon: MapPin,
      color: '#c084fc',
      glow: 'rgba(192, 132, 252, 0.2)'
    },
    {
      key: 'AGUARDANDO ENVIO',
      label: 'Aguardando Envio',
      sublabel: 'Fila de Correios',
      count: countAwaitingShipping,
      icon: Package,
      color: '#fb923c',
      glow: 'rgba(251, 146, 60, 0.2)'
    },
    {
      key: 'CONCLUIDO',
      label: 'Concluídos',
      sublabel: 'Enviado / Entregue',
      count: countCompleted,
      icon: CheckCheck,
      color: 'var(--success)',
      glow: 'var(--success-glow)'
    },
    {
      key: 'CANCELADO',
      label: 'Cancelados',
      sublabel: 'Devolvidos / Nulos',
      count: countCancelled,
      icon: XCircle,
      color: '#f87171',
      glow: 'rgba(248, 113, 113, 0.2)'
    }
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '1240px', margin: '0 auto' }}>
      {/* Topo da Tela */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)' }}>Painel de Vendas & Chat PIX</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Gerencie pedidos, envie a chave PIX pelo chat aos compradores e informe o rastreio dos Correios
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link
            to="/admin/visitors"
            className="btn btn-secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              textDecoration: 'none',
              borderColor: 'var(--success)',
              color: 'var(--success)'
            }}
          >
            <Activity size={16} />
            Ver Quem Acessou o Site
          </Link>

          <button
            className="btn btn-primary"
            onClick={handleDownloadReport}
            disabled={downloadingReport}
            style={{ display: 'inline-flex', gap: '0.5rem' }}
          >
            {downloadingReport ? <Loader className="animate-spin" size={16} /> : <Download size={16} />}
            Exportar Relatório PDF (Jasper)
          </button>
        </div>
      </div>

      {/* Seção 1: Cards de Métricas Globais (Macro) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem'
        }}
      >
        <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'var(--success-glow)', color: 'var(--success)', padding: '0.75rem', borderRadius: '50%' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>
              Receita Total (Paga)
            </span>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>
              {totalVendas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'var(--primary-glow)', color: 'var(--primary)', padding: '0.75rem', borderRadius: '50%' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>
              Total Geral de Pedidos
            </span>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>{totalPedidos}</span>
          </div>
        </div>
      </div>

      {/* Seção 2: Esteira de Status Interativa (Filtro por Cards) */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Filtrar Pedidos por Status
          </span>
          {statusFilter && (
            <button
              type="button"
              onClick={() => setStatusFilter(null)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-color)',
                borderRadius: '999px',
                padding: '0.25rem 0.75rem',
                color: 'var(--primary)',
                fontSize: '0.78rem',
                cursor: 'pointer',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'all 0.2s'
              }}
            >
              <X size={12} /> Limpar Filtro ({statusFilter})
            </button>
          )}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))',
            gap: '0.75rem'
          }}
        >
          {statusCards.map((card) => {
            const IconComponent = card.icon;
            const isSelected = (statusFilter === null && card.key === 'TODOS') || statusFilter === card.key;
            return (
              <div
                key={card.key}
                className="glass-panel"
                onClick={() => {
                  if (card.key === 'TODOS') {
                    setStatusFilter(null);
                  } else {
                    setStatusFilter((prev) => (prev === card.key ? null : card.key));
                  }
                }}
                style={{
                  padding: '0.9rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  border: isSelected ? `1.5px solid ${card.color}` : '1px solid var(--border-color)',
                  background: isSelected ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.015)',
                  boxShadow: isSelected ? `0 0 16px ${card.glow}` : 'none',
                  transform: isSelected ? 'translateY(-2px)' : 'none',
                  transition: 'all 0.2s ease',
                  userSelect: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                  <div
                    style={{
                      background: card.glow,
                      color: card.color,
                      padding: '0.45rem',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <IconComponent size={18} />
                  </div>
                  <span
                    style={{
                      fontSize: '1.4rem',
                      fontWeight: 800,
                      color: isSelected ? card.color : '#fff',
                      lineHeight: 1
                    }}
                  >
                    {card.count}
                  </span>
                </div>

                <div>
                  <span
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: isSelected ? '#fff' : 'var(--text-secondary)',
                      display: 'block',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {card.label}
                  </span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      color: 'var(--text-muted, #71717a)',
                      display: 'block'
                    }}
                  >
                    {card.sublabel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Listagem de Vendas */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', margin: 0 }}>
          Pedidos Recebidos{' '}
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
            ({filteredOrders.length} {filteredOrders.length === 1 ? 'pedido' : 'pedidos'})
          </span>
        </h3>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader className="animate-spin" size={24} style={{ color: 'var(--primary)' }} />
        </div>
      ) : filteredOrders.length > 0 ? (
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
                <th>Frete (Correios)</th>
                <th onClick={() => handleSort('totalAmount')}>
                  Total (PIX) <ArrowUpDown size={12} style={{ marginLeft: '0.25rem' }} />
                </th>
                <th style={{ textAlign: 'right' }}>Atendimento / Chat PIX</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const hasUnread = (order.unreadBuyerMessages ?? 0) > 0;
                const badge = getStatusBadgeStyle(order.status);
                return (
                  <tr key={order.id}>
                    <td style={{ fontSize: '0.85rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>
                      {hasUnread && (
                        <div style={{ marginBottom: '0.3rem' }}>
                          <span
                            onClick={() => handleOpenOrderChat(order)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              background: 'rgba(255, 71, 87, 0.18)',
                              color: '#ff4757',
                              border: '1px solid #ff4757',
                              borderRadius: '999px',
                              padding: '0.15rem 0.55rem',
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              fontFamily: 'var(--font-sans)',
                              cursor: 'pointer',
                              boxShadow: '0 0 10px rgba(255, 71, 87, 0.35)',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            <MessageSquare size={11} />
                            {order.unreadBuyerMessages === 1
                              ? '1 mensagem não lida'
                              : `${order.unreadBuyerMessages} mensagens não lidas`}
                          </span>
                        </div>
                      )}
                      <div>#{order.orderNumber || order.id.substring(0, 8)}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{order.clientName}</div>
                      {order.customerPhone && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{order.customerPhone}</div>
                      )}
                    </td>
                    <td>{order.createdAt}</td>
                    <td>
                      <span
                        style={{
                          padding: '0.2rem 0.55rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: badge.bg,
                          color: badge.color,
                          border: badge.border,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td>
                      {order.shippingCost === 0
                        ? 'Retirada (R$ 0,00)'
                        : order.shippingCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--success)' }}>
                      {order.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', position: 'relative' }}
                        onClick={() => handleOpenOrderChat(order)}
                      >
                        <MessageSquare size={14} />
                        {order.status === 'PENDENTE' ? 'Enviar PIX / Chat' : 'Abrir Chat / Rastreio'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : orders.length > 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '3.5rem 1.5rem',
            color: 'var(--text-secondary)',
            border: '1px dashed var(--border-color)',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255, 255, 255, 0.015)'
          }}
        >
          <div style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 600, marginBottom: '0.4rem' }}>
            Nenhum pedido encontrado para o status selecionado.
          </div>
          <p style={{ fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            Não há pedidos registrados com o status <strong>{statusFilter}</strong> no momento.
          </p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setStatusFilter(null)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}
          >
            <X size={14} /> Ver Todos os Pedidos
          </button>
        </div>
      ) : (
        <div
          style={{
            textAlign: 'center',
            padding: '4rem',
            color: 'var(--text-secondary)',
            border: '1px dashed var(--border-color)',
            borderRadius: 'var(--radius-md)'
          }}
        >
          Nenhuma transação registrada no sistema ainda.
        </div>
      )}

      {/* Modal de Atendimento, Envio de PIX e Gestão do Pedido */}
      {selectedOrder && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedOrder(null);
          }}
        >
          <div
            className="glass-panel"
            style={{
              maxWidth: '900px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: '1.5rem',
              borderRadius: 'var(--radius-lg)',
              background: '#0a0d13',
              border: '1px solid var(--border-glow)'
            }}
          >
            {/* Topo do Modal */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '1rem',
                marginBottom: '1.25rem'
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.3rem', color: '#fff' }}>
                  Atendimento do Pedido #{selectedOrder.orderNumber || selectedOrder.id.substring(0, 8)} — {selectedOrder.clientName}
                </h3>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Realizado em {selectedOrder.createdAt} • Total:{' '}
                  <strong style={{ color: 'var(--success)' }}>
                    {selectedOrder.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="btn btn-secondary"
                style={{ padding: '0.4rem 0.7rem' }}
              >
                <X size={16} /> Fechar
              </button>
            </div>

            {/* Resumo de Entrega Correios + Controle de Status e Rastreio */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1rem',
                marginBottom: '1.25rem'
              }}
            >
              {/* Dados de Entrega e Peças */}
              <div
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.85rem',
                  lineHeight: 1.6
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <MapPin size={14} />{' '}
                  {selectedOrder.shippingCost === 0
                    ? 'Dados do Cliente (Retirada com o Vendedor)'
                    : 'Dados de Entrega (Correios)'}
                </div>
                <div><strong>Cliente:</strong> {selectedOrder.clientName} {selectedOrder.clientEmail ? `(${selectedOrder.clientEmail})` : ''}</div>
                {selectedOrder.customerPhone && <div><strong>Telefone/WhatsApp:</strong> {selectedOrder.customerPhone}</div>}
                {selectedOrder.shippingAddress && (
                  <div>
                    <strong>Endereço:</strong> {selectedOrder.shippingAddress.streetName}, {selectedOrder.shippingAddress.streetNumber}
                    {selectedOrder.shippingAddress.complement ? ` (${selectedOrder.shippingAddress.complement})` : ''} -{' '}
                    {selectedOrder.shippingAddress.neighborhood}, {selectedOrder.shippingAddress.city}/{selectedOrder.shippingAddress.federalUnit} • CEP:{' '}
                    {selectedOrder.shippingAddress.zipCode}
                  </div>
                )}
                <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                  <strong>Peças do Pedido:</strong>
                  {selectedOrder.items?.map((it, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{it.quantity}x {it.productName}</span>
                      <span>{(it.price * it.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Atualizar Status e Código de Rastreio Correios */}
              <form
                onSubmit={handleSaveOrderDetails}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Truck size={14} /> Atualizar Status e Rastreio Correios
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                    Status do Pedido
                  </label>
                  <select
                    className="form-input"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem', height: 'auto' }}
                  >
                    <option value="PENDENTE">PENDENTE (Aguardando PIX)</option>
                    <option value="PAGO">PAGO (Em Produção 3D)</option>
                    <option value="AGUARDANDO RETIRADA">AGUARDANDO RETIRADA (Pronto para Retirada)</option>
                    <option value="AGUARDANDO ENVIO">AGUARDANDO ENVIO (Pronto para Postagem nos Correios)</option>
                    <option value="ENVIADO">ENVIADO (Postado nos Correios)</option>
                    <option value="ENTREGUE">ENTREGUE (Pedido Entregue ao Cliente)</option>
                    <option value="CANCELADO">CANCELADO</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                    Código de Rastreio (Correios)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: AA123456789BR"
                    value={editTrackingCode}
                    onChange={(e) => setEditTrackingCode(e.target.value)}
                    style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem', height: 'auto' }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-secondary"
                  disabled={savingOrderUpdate}
                  style={{ marginTop: 'auto', padding: '0.5rem', fontSize: '0.82rem', borderColor: 'var(--primary)', color: 'var(--primary)' }}
                >
                  <Save size={14} /> {savingOrderUpdate ? 'Salvando...' : 'Salvar Status / Rastreio'}
                </button>
              </form>
            </div>

            {/* Caixa de Diálogo / Chat com o Comprador */}
            <OrderChatBox
              orderId={selectedOrder.id}
              orderNumber={selectedOrder.orderNumber}
              orderTotal={selectedOrder.totalAmount}
              orderStatus={selectedOrder.status}
              shippingCost={selectedOrder.shippingCost}
              clientName={selectedOrder.clientName}
              customerPhone={selectedOrder.customerPhone || selectedOrder.shippingAddress?.phone}
              mode="seller"
              onStatusUpdated={(newStatus) => {
                setEditStatus(newStatus);
                setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
                setOrders((prev) =>
                  prev.map((o) => (o.id === selectedOrder.id ? { ...o, status: newStatus } : o))
                );
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
export default Dashboard;
