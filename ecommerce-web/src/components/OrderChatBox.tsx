import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import {
  Send,
  MessageSquare,
  Copy,
  Check,
  RefreshCw,
  QrCode,
  CheckCircle,
  ExternalLink,
  User as UserIcon,
  ShieldCheck
} from 'lucide-react';

export interface OrderMessageItem {
  id: string;
  orderId: string;
  senderUserId?: string;
  senderName: string;
  senderRole: 'COMPRADOR' | 'VENDEDOR';
  message: string;
  createdAt: string;
}

interface OrderChatBoxProps {
  orderId: string;
  orderNumber?: number;
  orderTotal: number;
  orderStatus: string;
  shippingCost?: number;
  itemsSummary?: string;
  clientName?: string;
  customerPhone?: string;
  whatsappNumber?: string;
  mode: 'buyer' | 'seller';
  onStatusUpdated?: (newStatus: string) => void;
}

export const OrderChatBox: React.FC<OrderChatBoxProps> = ({
  orderId,
  orderNumber,
  orderTotal,
  orderStatus,
  shippingCost,
  itemsSummary,
  clientName,
  customerPhone,
  whatsappNumber,
  mode,
  onStatusUpdated
}) => {
  const displayOrderNumber = orderNumber ? String(orderNumber) : orderId.substring(0, 8);
  const [messages, setMessages] = useState<OrderMessageItem[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [pixKeyInput, setPixKeyInput] = useState(() => localStorage.getItem('3dprintpng_seller_pix_key') || '');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const endpoint =
    mode === 'seller'
      ? `/api/admin/orders/${orderId}/messages`
      : `/api/checkout/orders/${orderId}/messages`;

  const fetchMessages = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get(endpoint);
      if (Array.isArray(res.data)) {
        setMessages(res.data);
      }
    } catch (e) {
      console.error('Erro ao carregar mensagens do pedido', e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages(false);
    const interval = setInterval(() => {
      fetchMessages(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [orderId, mode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = (customText ?? newMessage).trim();
    if (!textToSend || sending) return;

    setSending(true);
    try {
      const res = await api.post(endpoint, { message: textToSend });
      setMessages((prev) => [...prev, res.data]);
      if (!customText) {
        setNewMessage('');
      }
    } catch (err) {
      console.error('Erro ao enviar mensagem', err);
    } finally {
      setSending(false);
    }
  };

  const handleSendPixTemplate = () => {
    const cleanKey = pixKeyInput.trim();
    if (cleanKey) {
      localStorage.setItem('3dprintpng_seller_pix_key', cleanKey);
    }
    const formattedTotal = orderTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const msg = cleanKey
      ? `Segue a chave PIX para pagamento do seu pedido #${displayOrderNumber} no valor de ${formattedTotal}:\n\nChave PIX: ${cleanKey}\n\nAssim que realizar o pagamento, me avise por aqui para iniciarmos a impressão 3D!`
      : `Segue o valor total do seu pedido #${displayOrderNumber}: ${formattedTotal}.\nChave PIX: [INSIRA SUA CHAVE PIX AQUI]`;

    if (cleanKey) {
      handleSendMessage(undefined, msg);
    } else {
      setNewMessage(msg);
    }
  };

  const handleMarkAsPaid = async () => {
    if (updatingStatus) return;
    setUpdatingStatus(true);
    try {
      await api.patch(`/api/admin/orders/${orderId}`, { status: 'PAGO' });
      await handleSendMessage(
        undefined,
        `✅ Pagamento PIX confirmado! Seu pedido #${displayOrderNumber} já foi atualizado para PAGO e entrou na fila de produção 3D.`
      );
      if (onStatusUpdated) {
        onStatusUpdated('PAGO');
      }
    } catch (e) {
      console.error('Erro ao aprovar pagamento PIX', e);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleMarkAsDelivered = async () => {
    if (updatingStatus) return;
    setUpdatingStatus(true);
    try {
      await api.patch(`/api/admin/orders/${orderId}`, { status: 'ENTREGUE' });
      await handleSendMessage(
        undefined,
        `📦 Seu pedido #${displayOrderNumber} foi entregue! Muito obrigado pela sua compra na 3DPrintPNG!`
      );
      if (onStatusUpdated) {
        onStatusUpdated('ENTREGUE');
      }
    } catch (e) {
      console.error('Erro ao atualizar pedido para ENTREGUE', e);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2500);
  };

  const buildWhatsAppUrl = () => {
    const formattedTotal = orderTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const formattedShipping =
      shippingCost !== undefined
        ? ` (Frete Correios: ${shippingCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`
        : '';

    if (mode === 'seller') {
      const targetPhone = (customerPhone || '').replace(/\D/g, '');
      const phoneWithCountry = targetPhone.length >= 10 && !targetPhone.startsWith('55') ? `55${targetPhone}` : targetPhone;
      const text = `Olá ${clientName || ''}! Tudo bem? Estou entrando em contato sobre o seu pedido #${displayOrderNumber} na 3DPrintPNG${formattedShipping}. Total: ${formattedTotal}.`;
      return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(text)}`;
    } else {
      const targetPhone = (whatsappNumber || '').replace(/\D/g, '');
      const phoneWithCountry = targetPhone.length >= 10 && !targetPhone.startsWith('55') ? `55${targetPhone}` : targetPhone;
      const buyerIdentification = clientName ? `Olá! Meu nome é ${clientName} e acabei` : 'Olá! Acabei';
      const text = `${buyerIdentification} de finalizar o pedido #${displayOrderNumber} na 3DPrintPNG${itemsSummary ? ` (${itemsSummary})` : ''}${formattedShipping}. Valor total: ${formattedTotal}. Gostaria de receber a chave PIX para pagamento!`;
      return phoneWithCountry
        ? `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(text)}`
        : `https://wa.me/?text=${encodeURIComponent(text)}`;
    }
  };

  return (
    <div
      className="glass-panel"
      style={{
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-glow)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: '#0b0e14',
        textAlign: 'left'
      }}
    >
      {/* Cabeçalho da Caixa de Diálogo */}
      <div
        style={{
          padding: '1rem 1.25rem',
          background: 'rgba(0, 240, 255, 0.06)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'rgba(0, 240, 255, 0.14)',
              border: '1px solid var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)'
            }}
          >
            <MessageSquare size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Chat do Pedido #{displayOrderNumber}</span>
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '12px',
                  background: 'rgba(0, 255, 136, 0.12)',
                  color: 'var(--success)',
                  border: '1px solid rgba(0, 255, 136, 0.3)',
                  fontWeight: 700
                }}
              >
                Pagamento PIX
              </span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              {mode === 'buyer'
                ? 'Converse diretamente com o vendedor para receber a chave PIX'
                : `Conversa direta com o comprador ${clientName || ''}`}
            </div>
          </div>
        </div>

        {/* Botões de Ação no Topo (WhatsApp Opcional e Atualizar) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <a
            href={buildWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{
              padding: '0.4rem 0.75rem',
              fontSize: '0.78rem',
              borderColor: 'rgba(37, 211, 102, 0.45)',
              color: '#25D366',
              background: 'rgba(37, 211, 102, 0.08)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              textDecoration: 'none',
              fontWeight: 600
            }}
          >
            <ExternalLink size={13} />
            {mode === 'buyer' ? 'Chamar no WhatsApp (Opcional)' : 'Chamar Cliente no WhatsApp'}
          </a>

          <button
            type="button"
            onClick={() => fetchMessages(false)}
            className="btn btn-secondary"
            title="Atualizar mensagens"
            style={{ padding: '0.4rem 0.6rem', fontSize: '0.78rem' }}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Barra de Atalhos Rápidos do Vendedor (Admin) */}
      {mode === 'seller' && (
        <div
          style={{
            padding: '0.75rem 1.25rem',
            background: 'rgba(255, 255, 255, 0.02)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '0.6rem'
          }}
        >
          <input
            type="text"
            className="form-input"
            placeholder="Sua chave PIX ou Copia e Cola..."
            value={pixKeyInput}
            onChange={(e) => setPixKeyInput(e.target.value)}
            style={{ flex: '1 1 220px', padding: '0.4rem 0.75rem', fontSize: '0.82rem', height: 'auto' }}
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSendPixTemplate}
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
          >
            <QrCode size={14} /> Enviar Chave PIX no Chat
          </button>

          {orderStatus === 'PENDENTE' && (
            <button
              type="button"
              className="btn btn-secondary"
              disabled={updatingStatus}
              onClick={handleMarkAsPaid}
              style={{
                padding: '0.45rem 0.85rem',
                fontSize: '0.8rem',
                borderColor: 'var(--success)',
                color: 'var(--success)',
                whiteSpace: 'nowrap'
              }}
            >
              <CheckCircle size={14} /> Confirmar PIX Recebido (PAGO)
            </button>
          )}

          {(orderStatus === 'PAGO' || orderStatus === 'ENVIADO') && (
            <button
              type="button"
              className="btn btn-secondary"
              disabled={updatingStatus}
              onClick={handleMarkAsDelivered}
              style={{
                padding: '0.45rem 0.85rem',
                fontSize: '0.8rem',
                borderColor: 'var(--success)',
                color: 'var(--success)',
                whiteSpace: 'nowrap'
              }}
            >
              <CheckCircle size={14} /> Marcar como Entregue (ENTREGUE)
            </button>
          )}
        </div>
      )}

      {/* Área de Mensagens */}
      <div
        style={{
          height: '320px',
          overflowY: 'auto',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
          background: 'rgba(6, 8, 12, 0.65)'
        }}
      >
        {loading && messages.length === 0 ? (
          <div style={{ margin: 'auto', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Carregando conversa...
          </div>
        ) : messages.length === 0 ? (
          <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Nenhuma mensagem ainda. Envie uma mensagem abaixo para iniciar!
          </div>
        ) : (
          messages.map((msg) => {
            const isSeller = msg.senderRole === 'VENDEDOR';
            const isOwnMessage =
              (mode === 'seller' && isSeller) || (mode === 'buyer' && !isSeller);

            return (
              <div
                key={msg.id}
                style={{
                  alignSelf: isOwnMessage ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isOwnMessage ? 'flex-end' : 'flex-start'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.72rem',
                    color: isSeller ? 'var(--primary)' : 'var(--text-secondary)',
                    marginBottom: '0.25rem',
                    fontWeight: 600
                  }}
                >
                  {isSeller ? <ShieldCheck size={12} /> : <UserIcon size={12} />}
                  <span>{msg.senderName}</span>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>• {msg.createdAt}</span>
                </div>

                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: isOwnMessage ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    background: isSeller
                      ? 'rgba(0, 240, 255, 0.1)'
                      : 'rgba(255, 255, 255, 0.06)',
                    border: isSeller
                      ? '1px solid rgba(0, 240, 255, 0.35)'
                      : '1px solid var(--border-color)',
                    color: '#fff',
                    fontSize: '0.88rem',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}
                >
                  {msg.message}

                  {/* Botão rápido para copiar texto (útil quando o vendedor envia a chave PIX) */}
                  {isSeller && mode === 'buyer' && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => handleCopyText(msg.id, msg.message)}
                        style={{
                          background: 'rgba(0, 0, 0, 0.35)',
                          border: '1px solid rgba(0, 240, 255, 0.3)',
                          color: 'var(--primary)',
                          borderRadius: '4px',
                          padding: '0.2rem 0.5rem',
                          fontSize: '0.72rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontWeight: 600
                        }}
                      >
                        {copiedMsgId === msg.id ? <Check size={12} /> : <Copy size={12} />}
                        {copiedMsgId === msg.id ? 'Copiado!' : 'Copiar mensagem / PIX'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Campo de Envio de Nova Mensagem */}
      <form
        onSubmit={(e) => handleSendMessage(e)}
        style={{
          padding: '0.85rem 1rem',
          background: 'rgba(255, 255, 255, 0.02)',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          alignItems: 'center'
        }}
      >
        <textarea
          rows={2}
          className="form-input"
          placeholder={
            mode === 'buyer'
              ? 'Digite sua mensagem para o vendedor (ex: pedir chave PIX, avisar que pagou, dúvidas)...'
              : 'Digite a mensagem ou envie a chave PIX para o comprador...'
          }
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          style={{
            flex: '1 1 200px',
            resize: 'none',
            fontSize: '0.88rem',
            padding: '0.6rem 0.85rem'
          }}
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={sending || !newMessage.trim()}
          style={{
            padding: '0.7rem 1.1rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            whiteSpace: 'nowrap'
          }}
        >
          <Send size={16} />
          {sending ? 'Enviando...' : 'Enviar'}
        </button>
      </form>
    </div>
  );
};

export default OrderChatBox;
