import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  QrCode,
  Copy,
  Check,
  RefreshCw,
  ArrowLeft,
  Sparkles,
  X
} from 'lucide-react';

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  status: string;
  paymentMethod: string;
  shippingCost: number;
  totalAmount: number;
  mercadoPagoPaymentId: string;
  trackingCode: string;
  pixQrCode?: string;
  pixQrCodeBase64?: string;
  simulatedPayment?: boolean;
  createdAt: string;
  items: OrderItem[];
}

export const MyOrders: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPixOrder, setSelectedPixOrder] = useState<Order | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [checkingId, setCheckingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/my-orders');
      return;
    }
    fetchMyOrders();
  }, [user]);

  const fetchMyOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/checkout/my-orders');
      setOrders(res.data);
    } catch (e) {
      console.error('Erro ao buscar pedidos do cliente', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async (orderId: string) => {
    setCheckingId(orderId);
    try {
      const res = await api.get(`/api/checkout/orders/${orderId}/status`);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? res.data : o)));
      if (selectedPixOrder?.id === orderId) {
        setSelectedPixOrder(res.data);
      }
    } catch (e) {
      console.error('Erro ao atualizar status do pedido', e);
    } finally {
      setCheckingId(null);
    }
  };

  const handleSimulateApprove = async (orderId: string) => {
    setCheckingId(orderId);
    try {
      const res = await api.post(`/api/checkout/orders/${orderId}/simulate-approve`);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? res.data : o)));
      setSelectedPixOrder(null);
    } catch (e) {
      console.error('Erro ao simular aprovação', e);
    } finally {
      setCheckingId(null);
    }
  };

  const handleCopyPix = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 3000);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1050px', margin: '0 auto' }}>
      <button
        onClick={() => navigate('/')}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: '0.9rem',
          marginBottom: '1rem'
        }}
      >
        <ArrowLeft size={16} />
        Voltar ao Catálogo
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontFamily: 'var(--font-display)', color: '#fff' }}>Meus Pedidos</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Acompanhe o status do pagamento, produção 3D e rastreio das suas peças
          </p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={fetchMyOrders}>
          <RefreshCw size={15} /> Atualizar Lista
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Carregando seus pedidos...</div>
      ) : orders.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem', borderRadius: 'var(--radius-md)' }}>
          <Package size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.4 }} />
          <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>Você ainda não realizou nenhum pedido</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Explore nosso catálogo de peças 3D e faça seu primeiro pedido!
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Ver Catálogo de Peças
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {orders.map((order) => {
            const isPaid = order.status === 'PAGO' || order.status === 'ENVIADO';
            const isPending = order.status === 'PENDENTE';
            return (
              <div
                key={order.id}
                className="glass-panel"
                style={{
                  padding: '1.5rem',
                  borderRadius: 'var(--radius-md)',
                  border: isPaid ? '1px solid rgba(0, 255, 136, 0.25)' : '1px solid var(--border-color)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      PEDIDO #{order.id.substring(0, 8)}
                    </span>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                      Realizado em {order.createdAt} • Meio: <strong>{order.paymentMethod?.toUpperCase() || 'MERCADO PAGO'}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        background: isPaid ? 'var(--success-glow)' : 'rgba(255, 183, 0, 0.12)',
                        color: isPaid ? 'var(--success)' : '#ffd166',
                        border: `1px solid ${isPaid ? 'var(--success)' : 'rgba(255, 183, 0, 0.35)'}`
                      }}
                    >
                      {order.status === 'ENVIADO' ? (
                        <Truck size={14} />
                      ) : isPaid ? (
                        <CheckCircle size={14} />
                      ) : (
                        <Clock size={14} />
                      )}
                      {order.status}
                    </span>

                    {isPending && order.pixQrCode && (
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                        onClick={() => setSelectedPixOrder(order)}
                      >
                        <QrCode size={14} /> Pagar PIX
                      </button>
                    )}

                    {isPending && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                        onClick={() => handleCheckStatus(order.id)}
                        disabled={checkingId === order.id}
                      >
                        <RefreshCw size={13} className={checkingId === order.id ? 'animate-spin' : ''} />
                        Verificar Pagamento
                      </button>
                    )}
                  </div>
                </div>

                {/* Lista de Itens do Pedido */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                  {order.items?.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span>
                        <strong>{item.quantity}x</strong> {item.productName}
                      </span>
                      <span>{(item.price * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                  ))}
                </div>

                {/* Rodapé com Frete, Rastreio e Total */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem', fontSize: '0.85rem' }}>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    Frete: <strong>{order.shippingCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                    {order.trackingCode && (
                      <span style={{ marginLeft: '1rem', color: 'var(--primary)' }}>
                        • Rastreio Correios: <strong>{order.trackingCode}</strong>
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--success)' }}>
                    Total: {order.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal para Reabrir QR Code PIX Pendente */}
      {selectedPixOrder && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedPixOrder(null);
          }}
        >
          <div className="glass-panel" style={{ maxWidth: '480px', width: '100%', padding: '2rem', borderRadius: 'var(--radius-lg)', textAlign: 'center', position: 'relative' }}>
            <button
              onClick={() => setSelectedPixOrder(null)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.35rem', color: '#fff', marginBottom: '0.5rem' }}>
              QR Code PIX — Pedido #{selectedPixOrder.id.substring(0, 8)}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Valor: <strong style={{ color: 'var(--success)' }}>{selectedPixOrder.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
            </p>

            <div style={{ background: '#fff', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'inline-block', marginBottom: '1.25rem' }}>
              {selectedPixOrder.pixQrCodeBase64 ? (
                <img
                  src={`data:image/png;base64,${selectedPixOrder.pixQrCodeBase64}`}
                  alt="QR Code PIX"
                  style={{ width: '200px', height: '200px', display: 'block' }}
                />
              ) : (
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(selectedPixOrder.pixQrCode || '3DPrintPNG')}`}
                  alt="QR Code PIX"
                  style={{ width: '200px', height: '200px', display: 'block' }}
                />
              )}
            </div>

            {selectedPixOrder.pixQrCode && (
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <input
                  type="text"
                  readOnly
                  value={selectedPixOrder.pixQrCode}
                  className="form-input"
                  style={{ flex: 1, fontSize: '0.78rem', fontFamily: 'monospace' }}
                />
                <button type="button" className="btn btn-primary" onClick={() => handleCopyPix(selectedPixOrder.pixQrCode!)}>
                  {copiedPix ? <Check size={15} /> : <Copy size={15} />}
                  {copiedPix ? 'Copiado' : 'Copiar'}
                </button>
              </div>
            )}

            {selectedPixOrder.simulatedPayment && (
              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: '100%', marginTop: '0.5rem', borderColor: 'var(--success)', color: 'var(--success)' }}
                onClick={() => handleSimulateApprove(selectedPixOrder.id)}
              >
                <Sparkles size={15} /> Simular Pagamento PIX Aprovado
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrders;
