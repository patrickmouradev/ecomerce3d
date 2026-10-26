import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import OrderChatBox from '../components/OrderChatBox';
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  MessageSquare,
  RefreshCw,
  ArrowLeft,
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
  orderNumber?: number;
  clientName?: string;
  status: string;
  paymentMethod: string;
  shippingCost: number;
  totalAmount: number;
  trackingCode: string;
  createdAt: string;
  unreadSellerMessages?: number;
  items: OrderItem[];
}

export const MyOrders: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChatOrder, setSelectedChatOrder] = useState<Order | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState<string>('');

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/my-orders');
      return;
    }
    fetchMyOrders();
    fetchConfig();
  }, [user]);

  const fetchConfig = async () => {
    try {
      const res = await api.get('/api/checkout/config');
      if (res.data?.whatsappNumber) {
        setWhatsappNumber(res.data.whatsappNumber);
      }
    } catch {
      // Ignore
    }
  };

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

  return (
    <div className="page-container" style={{ maxWidth: '1050px' }}>
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
            Acompanhe seus pedidos, converse com o vendedor para pagamento PIX e veja o rastreio Correios
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
            const isPaid =
              order.status === 'PAGO' ||
              order.status === 'AGUARDANDO RETIRADA' ||
              order.status === 'ENVIADO' ||
              order.status === 'ENTREGUE';
            const hasUnread = (order.unreadSellerMessages ?? 0) > 0;
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
                    {hasUnread && (
                      <div style={{ marginBottom: '0.3rem' }}>
                        <span
                          onClick={() => {
                            setOrders((prev) =>
                              prev.map((o) => (o.id === order.id ? { ...o, unreadSellerMessages: 0 } : o))
                            );
                            setSelectedChatOrder({ ...order, unreadSellerMessages: 0 });
                          }}
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
                            cursor: 'pointer',
                            boxShadow: '0 0 10px rgba(255, 71, 87, 0.35)'
                          }}
                        >
                          <MessageSquare size={11} />
                          {order.unreadSellerMessages === 1
                            ? '1 mensagem não lida'
                            : `${order.unreadSellerMessages} mensagens não lidas`}
                        </span>
                      </div>
                    )}
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      PEDIDO #{order.orderNumber || order.id.substring(0, 8)}
                    </span>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                      Realizado em {order.createdAt} • Pagamento: <strong>PIX</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
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

                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}
                      onClick={() => {
                        setOrders((prev) =>
                          prev.map((o) => (o.id === order.id ? { ...o, unreadSellerMessages: 0 } : o))
                        );
                        setSelectedChatOrder({ ...order, unreadSellerMessages: 0 });
                      }}
                    >
                      <MessageSquare size={15} />
                      {order.status === 'PENDENTE' ? 'Abrir Chat / Receber PIX' : 'Abrir Chat com Vendedor'}
                    </button>
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
                    Frete Correios: <strong>{order.shippingCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
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

      {/* Modal da Caixa de Diálogo (Chat PIX entre Comprador e Vendedor) */}
      {selectedChatOrder && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedChatOrder(null);
          }}
        >
          <div style={{ maxWidth: '720px', width: '100%', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
              <button
                onClick={() => setSelectedChatOrder(null)}
                className="btn btn-secondary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
              >
                <X size={15} /> Fechar Chat
              </button>
            </div>

            <OrderChatBox
              orderId={selectedChatOrder.id}
              orderNumber={selectedChatOrder.orderNumber}
              orderTotal={selectedChatOrder.totalAmount}
              orderStatus={selectedChatOrder.status}
              shippingCost={selectedChatOrder.shippingCost}
              itemsSummary={selectedChatOrder.items?.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
              clientName={selectedChatOrder.clientName || user?.name}
              whatsappNumber={whatsappNumber}
              mode="buyer"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrders;
