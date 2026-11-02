import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useWebPush } from '../../hooks/useWebPush';
import {
  Bell,
  Send,
  History,
  Smartphone,
  Users,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  Eye,
  Check,
  Laptop
} from 'lucide-react';

interface PushCampaign {
  id: string;
  title: string;
  body: string;
  targetUrl: string;
  targetRole: string;
  targetUserEmail?: string;
  totalTargeted: number;
  totalSuccess: number;
  totalFailed: number;
  createdByName?: string;
  createdAt: string;
}

interface PushStats {
  totalActiveSubscriptions: number;
  androidSubscriptions: number;
  iosSubscriptions: number;
  desktopSubscriptions: number;
  totalCampaignsSent: number;
}

export const PushNotifications: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'NEW' | 'HISTORY'>('NEW');
  const [stats, setStats] = useState<PushStats>({
    totalActiveSubscriptions: 0,
    androidSubscriptions: 0,
    iosSubscriptions: 0,
    desktopSubscriptions: 0,
    totalCampaignsSent: 0
  });

  const { isSupported, isSubscribed, subscribeToPush, loading: pushSubLoading, error: pushSubError } = useWebPush();

  // Formulário de Disparo
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetUrl, setTargetUrl] = useState('/catalog');
  const [targetRole, setTargetRole] = useState<'TODOS' | 'USUARIO' | 'FINANCEIRO' | 'ADMINISTRADOR' | 'ESPECIFICO'>('TODOS');
  const [targetEmail, setTargetEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const handleQuickTest = async () => {
    if (!isSubscribed) {
      const ok = await subscribeToPush();
      if (!ok) return;
    }
    setSending(true);
    setSendSuccess(null);
    setSendError(null);
    try {
      const payload = {
        title: '🔔 Teste de Notificação 3DPrintPNG',
        body: 'Parabéns! Suas notificações Web Push estão funcionando perfeitamente.',
        targetUrl: '/admin/push',
        targetRole: 'TODOS'
      };
      const res = await api.post('/api/admin/push/broadcast', payload);
      setSendSuccess(`Notificação de teste disparada! ${res.data?.totalSuccess || 0} dispositivos entregues.`);
      fetchStats();
    } catch (err: any) {
      setSendError(err?.response?.data?.message || 'Falha ao disparar notificação de teste.');
    } finally {
      setSending(false);
    }
  };

  // Histórico
  const [campaigns, setCampaigns] = useState<PushCampaign[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    fetchStats();
    if (activeTab === 'HISTORY') {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const res = await api.get<PushStats>('/api/admin/push/stats');
      setStats(res.data);
    } catch (err) {
      console.warn('Estatísticas de push não disponíveis ou sem dados no momento', err);
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.get<PushCampaign[]>('/api/admin/push/campaigns');
      setCampaigns(res.data);
    } catch (err) {
      console.warn('Erro ao carregar histórico de campanhas', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSendPush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      alert('Preencha o título e a mensagem da notificação.');
      return;
    }

    if (targetRole === 'ESPECIFICO' && !targetEmail.trim()) {
      alert('Digite o e-mail do cliente destinatário.');
      return;
    }

    if (!window.confirm(`Confirmar o disparo imediato desta notificação para o público selecionado?`)) {
      return;
    }

    setSending(true);
    setSendSuccess(null);
    setSendError(null);

    try {
      const payload = {
        title: title.trim(),
        body: body.trim(),
        targetUrl: targetUrl.trim() || '/',
        targetRole,
        targetEmail: targetRole === 'ESPECIFICO' ? targetEmail.trim() : null
      };

      const res = await api.post('/api/admin/push/broadcast', payload);
      setSendSuccess(`Notificação disparada com sucesso! ${res.data?.totalSuccess || 0} dispositivos entregues.`);
      setTitle('');
      setBody('');
      setTargetEmail('');
      fetchStats();
    } catch (err: any) {
      console.error('Erro ao disparar notificação', err);
      setSendError(err?.response?.data?.message || 'Falha ao processar o envio das notificações.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      {/* Topo / Navegação */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
            <Link
              to="/admin/dashboard"
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', textDecoration: 'none' }}
            >
              <ArrowLeft size={14} /> Voltar ao Painel
            </Link>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.2rem 0.65rem',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 700,
                background: 'rgba(0, 240, 255, 0.12)',
                color: 'var(--primary)',
                border: '1px solid rgba(0, 240, 255, 0.3)'
              }}
            >
              <Bell size={12} />
              Web Push PWA Ativo
            </span>
          </div>
          <h2 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', margin: 0 }}>
            Central de Notificações Push
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
            Envie promoções de marketing, avisos financeiros ou alertas operacionais direto na tela dos celulares inscritos
          </p>
        </div>

        {/* Abas */}
        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.04)', padding: '0.35rem', borderRadius: 'var(--radius-md)' }}>
          <button
            type="button"
            onClick={() => setActiveTab('NEW')}
            className={`btn ${activeTab === 'NEW' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.85rem', padding: '0.5rem 0.95rem' }}
          >
            <Send size={15} /> Novo Disparo
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('HISTORY')}
            className={`btn ${activeTab === 'HISTORY' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.85rem', padding: '0.5rem 0.95rem' }}
          >
            <History size={15} /> Histórico & Auditoria
          </button>
        </div>
      </div>

      {/* Cards de Métricas de Dispositivos */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}
      >
        <div className="glass-panel" style={{ padding: '1.15rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <span>Total de Aparelhos Inscritos</span>
            <Smartphone size={16} className="text-cyan-400" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.4rem' }}>
            {stats.totalActiveSubscriptions}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Prontos para receber notificações
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.15rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <span>Android (Chrome / Edge)</span>
            <Users size={16} style={{ color: 'var(--success)' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--success)', marginTop: '0.4rem' }}>
            {stats.androidSubscriptions}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Inscrições via ecossistema Google
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.15rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <span>Apple (iOS Standalone)</span>
            <Smartphone size={16} style={{ color: '#a855f7' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#a855f7', marginTop: '0.4rem' }}>
            {stats.iosSubscriptions}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            iPhones com App na Tela Inicial
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.15rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <span>Campanhas Enviadas</span>
            <CheckCircle size={16} style={{ color: 'var(--primary)' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.4rem' }}>
            {stats.totalCampaignsSent}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Disparos registrados no histórico
          </div>
        </div>
      </div>

      {/* ABA 1: NOVO DISPARO MANUAL */}
      {activeTab === 'NEW' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem' }}>
          {/* Formulário */}
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            {/* Card de Teste Rápido no Navegador do Admin */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Laptop size={18} className="text-cyan-400" />
                  <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>Diagnóstico deste Computador / Aparelho:</span>
                </div>
                {isSubscribed ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: 'var(--success)', background: 'rgba(0, 255, 136, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '999px', border: '1px solid rgba(0, 255, 136, 0.3)' }}>
                    <Check size={12} /> Inscrito para Notificações
                  </span>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: 'var(--warning)', background: 'rgba(255, 183, 0, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '999px', border: '1px solid rgba(255, 183, 0, 0.3)' }}>
                    <AlertTriangle size={12} /> Não Inscrito neste Aparelho
                  </span>
                )}
              </div>

              {!isSupported ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>
                  Atenção: Seu navegador não suporta Web Push ou a página precisa estar em HTTPS/localhost.
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  {!isSubscribed ? (
                    <button
                      type="button"
                      onClick={async () => {
                        const ok = await subscribeToPush();
                        if (ok) fetchStats();
                      }}
                      disabled={pushSubLoading}
                      className="btn btn-primary"
                      style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}
                    >
                      <Bell size={14} />
                      {pushSubLoading ? 'Ativando...' : 'Ativar Notificações Neste Aparelho'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleQuickTest}
                      disabled={sending}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem', borderColor: 'var(--primary)', color: 'var(--primary)' }}
                    >
                      <Send size={14} />
                      {sending ? 'Disparando...' : 'Enviar Notificação de Teste Imediata'}
                    </button>
                  )}
                  {pushSubError && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>{pushSubError}</span>
                  )}
                </div>
              )}
            </div>

            <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Send size={18} className="text-cyan-400" />
              Compor Notificação Push
            </h3>

            {sendSuccess && (
              <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-md)', background: 'rgba(0, 255, 136, 0.12)', border: '1px solid rgba(0, 255, 136, 0.3)', color: 'var(--success)', marginBottom: '1.25rem', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Check size={18} />
                <span>{sendSuccess}</span>
              </div>
            )}

            {sendError && (
              <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-md)', background: 'rgba(255, 59, 48, 0.12)', border: '1px solid rgba(255, 59, 48, 0.3)', color: 'var(--danger)', marginBottom: '1.25rem', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={18} />
                <span>{sendError}</span>
              </div>
            )}

            <form onSubmit={handleSendPush}>
              {/* Segmentação */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  Público Alvo (Segmento):
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setTargetRole('TODOS')}
                    style={{
                      padding: '0.65rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      background: targetRole === 'TODOS' ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${targetRole === 'TODOS' ? 'var(--primary)' : 'var(--border-color)'}`,
                      color: targetRole === 'TODOS' ? 'var(--primary)' : 'var(--text-secondary)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Todos os Dispositivos
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetRole('USUARIO')}
                    style={{
                      padding: '0.65rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      background: targetRole === 'USUARIO' ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${targetRole === 'USUARIO' ? 'var(--primary)' : 'var(--border-color)'}`,
                      color: targetRole === 'USUARIO' ? 'var(--primary)' : 'var(--text-secondary)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Clientes Cadastrados
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetRole('FINANCEIRO')}
                    style={{
                      padding: '0.65rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      background: targetRole === 'FINANCEIRO' ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${targetRole === 'FINANCEIRO' ? 'var(--success)' : 'var(--border-color)'}`,
                      color: targetRole === 'FINANCEIRO' ? 'var(--success)' : 'var(--text-secondary)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Equipe Financeira
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetRole('ADMINISTRADOR')}
                    style={{
                      padding: '0.65rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      background: targetRole === 'ADMINISTRADOR' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${targetRole === 'ADMINISTRADOR' ? '#a855f7' : 'var(--border-color)'}`,
                      color: targetRole === 'ADMINISTRADOR' ? '#a855f7' : 'var(--text-secondary)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Administradores
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetRole('ESPECIFICO')}
                    style={{
                      padding: '0.65rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      background: targetRole === 'ESPECIFICO' ? 'rgba(255, 183, 0, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${targetRole === 'ESPECIFICO' ? 'var(--warning)' : 'var(--border-color)'}`,
                      color: targetRole === 'ESPECIFICO' ? 'var(--warning)' : 'var(--text-secondary)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Cliente Específico
                  </button>
                </div>
              </div>

              {targetRole === 'ESPECIFICO' && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    E-mail do Cliente Cadastrado:
                  </label>
                  <input
                    type="email"
                    value={targetEmail}
                    onChange={(e) => setTargetEmail(e.target.value)}
                    placeholder="cliente@exemplo.com"
                    className="input-field"
                    style={{ width: '100%' }}
                    required
                  />
                </div>
              )}

              {/* Título */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Título do Push:</label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{title.length}/60</span>
                </div>
                <input
                  type="text"
                  maxLength={60}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Queima de Estoque Filamentos 3D!"
                  className="input-field"
                  style={{ width: '100%' }}
                  required
                />
              </div>

              {/* Mensagem */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Mensagem / Corpo:</label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{body.length}/180</span>
                </div>
                <textarea
                  maxLength={180}
                  rows={3}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Ex: Todos os filamentos PLA e PETG com até 30% OFF neste fim de semana. Aproveite!"
                  className="input-field"
                  style={{ width: '100%', resize: 'none' }}
                  required
                />
              </div>

              {/* URL de Redirecionamento */}
              <div style={{ marginBottom: '1.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Link de Destino (Ao clicar no celular):
                </label>
                <input
                  type="text"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="/catalog ou /checkout"
                  className="input-field"
                  style={{ width: '100%' }}
                />
              </div>

              <button
                type="submit"
                disabled={sending || !title.trim() || !body.trim()}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem', fontWeight: 800 }}
              >
                {sending ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    Disparando Notificações...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Disparar Push Agora
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Pré-visualização Real no Smartphone */}
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
              <Eye size={18} />
              Pré-visualização no Smartphone
            </h3>

            <div
              style={{
                background: '#040507',
                border: '2px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '32px',
                padding: '1.25rem',
                maxWidth: '380px',
                margin: '0 auto',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 25px rgba(0, 240, 255, 0.1)'
              }}
            >
              {/* Barra superior de status do celular */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#888', marginBottom: '1.5rem', padding: '0 0.5rem' }}>
                <span>13:00</span>
                <span>5G • 100%</span>
              </div>

              {/* Notificação Banner */}
              <div
                style={{
                  background: 'rgba(25, 28, 36, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '16px',
                  padding: '0.85rem 1rem',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontSize: '0.65rem', fontWeight: 900 }}>
                      3D
                    </div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>3DPrintPNG</span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#888' }}>agora</span>
                </div>

                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', marginBottom: '0.2rem' }}>
                  {title || 'Título da Notificação'}
                </div>

                <div style={{ fontSize: '0.8rem', color: '#ccc', lineHeight: 1.35 }}>
                  {body || 'O texto da mensagem promocional ou transacional aparecerá aqui exatamente como o cliente verá.'}
                </div>
              </div>

              <div style={{ marginTop: '3.5rem', textAlign: 'center', color: '#555', fontSize: '0.75rem' }}>
                Simulação da Central de Notificações
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: HISTÓRICO E AUDITORIA */}
      {activeTab === 'HISTORY' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <History size={18} className="text-cyan-400" />
              Histórico de Envios & Validação de Entrega
            </h3>
            <button
              type="button"
              onClick={fetchHistory}
              disabled={loadingHistory}
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
            >
              <RefreshCw size={14} className={loadingHistory ? 'animate-spin' : ''} />
              Recarregar
            </button>
          </div>

          {loadingHistory ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.75rem auto' }} />
              <p>Carregando histórico de campanhas...</p>
            </div>
          ) : campaigns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <Bell size={32} style={{ margin: '0 auto 0.75rem auto', opacity: 0.4 }} />
              <p>Nenhuma campanha manual disparada até o momento.</p>
              <button
                type="button"
                onClick={() => setActiveTab('NEW')}
                className="btn btn-primary"
                style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}
              >
                Fazer Primeiro Disparo
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '0.75rem' }}>Data / Hora</th>
                    <th style={{ padding: '0.75rem' }}>Título</th>
                    <th style={{ padding: '0.75rem' }}>Segmento</th>
                    <th style={{ padding: '0.75rem' }}>Destinatários</th>
                    <th style={{ padding: '0.75rem' }}>Sucesso (201)</th>
                    <th style={{ padding: '0.75rem' }}>Falhas (410)</th>
                    <th style={{ padding: '0.75rem' }}>Disparado Por</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((camp) => (
                    <tr key={camp.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td style={{ padding: '0.75rem', whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {new Date(camp.createdAt).toLocaleString('pt-BR')}
                      </td>
                      <td style={{ padding: '0.75rem', fontWeight: 600, color: '#fff' }}>
                        {camp.title}
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                          Destino: {camp.targetUrl}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span
                          style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background:
                              camp.targetRole === 'FINANCEIRO'
                                ? 'rgba(0, 255, 136, 0.12)'
                                : camp.targetRole === 'ADMINISTRADOR'
                                ? 'rgba(168, 85, 247, 0.12)'
                                : 'rgba(0, 240, 255, 0.12)',
                            color:
                              camp.targetRole === 'FINANCEIRO'
                                ? 'var(--success)'
                                : camp.targetRole === 'ADMINISTRADOR'
                                ? '#a855f7'
                                : 'var(--primary)'
                          }}
                        >
                          {camp.targetRole === 'USUARIO'
                            ? 'Clientes'
                            : camp.targetRole === 'FINANCEIRO'
                            ? 'Financeiro'
                            : camp.targetRole === 'ADMINISTRADOR'
                            ? 'Admins'
                            : camp.targetUserEmail || 'Específico'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', fontWeight: 700 }}>
                        {camp.totalTargeted}
                      </td>
                      <td style={{ padding: '0.75rem', color: 'var(--success)', fontWeight: 700 }}>
                        {camp.totalSuccess}
                      </td>
                      <td style={{ padding: '0.75rem', color: camp.totalFailed > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                        {camp.totalFailed}
                      </td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                        {camp.createdByName || 'Admin'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PushNotifications;
