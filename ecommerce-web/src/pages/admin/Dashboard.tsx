import React, { useState, useEffect } from 'react';
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
  Save
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
  status: string; // PENDENTE, PAGO, ENVIADO, CANCELADO
  shippingCost: number;
  totalAmount: number;
  trackingCode: string;
  shippingAddress?: AddressDto;
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

  // Modal de Atendimento / Chat PIX do Pedido
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editStatus, setEditStatus] = useState<string>('PENDENTE');
  const [editTrackingCode, setEditTrackingCode] = useState<string>('');
  const [savingOrderUpdate, setSavingOrderUpdate] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [sortBy, direction]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/orders');
      setOrders(response.data);
    } catch (e) {
      console.error('Erro ao buscar vendas', e);
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

  const handleOpenOrderChat = (order: Order) => {
    setSelectedOrder(order);
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
  const totalVendas = orders.reduce(
    (sum, o) => sum + (o.status === 'PAGO' || o.status === 'ENVIADO' ? o.totalAmount : 0),
    0
  );
  const totalPedidos = orders.length;
  const pedidosPendentes = orders.filter((o) => o.status === 'PENDENTE').length;

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

      {/* Cards de Métricas */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.5rem',
          marginBottom: '3rem'
        }}
      >
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'var(--success-glow)', color: 'var(--success)', padding: '0.75rem', borderRadius: '50%' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>
              Receita Total (Paga)
            </span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>
              {totalVendas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'var(--primary-glow)', color: 'var(--primary)', padding: '0.75rem', borderRadius: '50%' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>
              Total de Pedidos
            </span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>{totalPedidos}</span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(255, 183, 0, 0.1)', color: 'var(--warning)', padding: '0.75rem', borderRadius: '50%' }}>
            <Clock size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>
              Aguardando PIX (Pendentes)
            </span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>{pedidosPendentes}</span>
          </div>
        </div>
      </div>

      {/* Listagem de Vendas */}
      <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', marginBottom: '1.25rem' }}>
        Pedidos Recebidos
      </h3>

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
                <th>Frete (Correios)</th>
                <th onClick={() => handleSort('totalAmount')}>
                  Total (PIX) <ArrowUpDown size={12} style={{ marginLeft: '0.25rem' }} />
                </th>
                <th style={{ textAlign: 'right' }}>Atendimento / Chat PIX</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td style={{ fontSize: '0.85rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>
                    #{order.orderNumber || order.id.substring(0, 8)}
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
                        background:
                          order.status === 'PAGO' || order.status === 'ENVIADO'
                            ? 'var(--success-glow)'
                            : 'rgba(255, 183, 0, 0.1)',
                        color:
                          order.status === 'PAGO' || order.status === 'ENVIADO'
                            ? 'var(--success)'
                            : 'var(--warning)',
                        border: `1px solid ${
                          order.status === 'PAGO' || order.status === 'ENVIADO'
                            ? 'rgba(0, 255, 136, 0.2)'
                            : 'rgba(255, 183, 0, 0.2)'
                        }`
                      }}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td>{order.shippingCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  <td style={{ fontWeight: 700, color: 'var(--success)' }}>
                    {order.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                      onClick={() => handleOpenOrderChat(order)}
                    >
                      <MessageSquare size={14} />
                      {order.status === 'PENDENTE' ? 'Enviar PIX / Chat' : 'Abrir Chat / Rastreio'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
                  <MapPin size={14} /> Dados de Entrega (Correios)
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
                    <option value="ENVIADO">ENVIADO (Postado nos Correios)</option>
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
