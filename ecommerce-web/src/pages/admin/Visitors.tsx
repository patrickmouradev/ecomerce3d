import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  Users,
  Eye,
  MapPin,
  Smartphone,
  Monitor,
  ShoppingCart,
  Box,
  RefreshCw,
  Trash2,
  Search,
  UserCheck,
  Globe,
  Activity,
  ArrowLeft,
  Sparkles
} from 'lucide-react';

interface SiteVisitLog {
  id: string;
  visitorId: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  ipAddress?: string;
  city?: string;
  region?: string;
  country?: string;
  isp?: string;
  deviceType?: string;
  os?: string;
  browser?: string;
  eventType: 'PAGE_VIEW' | 'PRODUCT_VIEW' | 'ADD_TO_CART' | string;
  pagePath: string;
  productId?: string;
  productName?: string;
  referrer?: string;
  createdAt: string;
}

interface TopProductViewed {
  productName: string;
  totalViews: number;
  uniqueViewers: number;
}

interface SiteVisitDashboard {
  activeVisitorsLast5Min: number;
  uniqueVisitorsToday: number;
  totalEventsToday: number;
  uniqueVisitorsTotal: number;
  identifiedUsersTotal: number;
  topProductsViewed: TopProductViewed[];
  recentLogs: SiteVisitLog[];
}

export const Visitors: React.FC = () => {
  const [dashboard, setDashboard] = useState<SiteVisitDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'ALL' | 'IDENTIFIED' | 'PRODUCTS' | 'CART'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    fetchVisits(false);
    const interval = setInterval(() => {
      fetchVisits(true);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchVisits = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get<SiteVisitDashboard>('/api/admin/analytics/visits?limit=250');
      setDashboard(res.data);
    } catch (err) {
      console.error('Erro ao buscar monitoramento de acessos', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleClearLogs = async () => {
    if (!window.confirm('Deseja realmente limpar todo o histórico de acessos do site?')) return;
    setClearing(true);
    try {
      await api.delete('/api/admin/analytics/visits');
      await fetchVisits(false);
    } catch (err) {
      console.error('Erro ao limpar histórico de acessos', err);
      alert('Não foi possível limpar os registros de acesso.');
    } finally {
      setClearing(false);
    }
  };

  const formatPageLabel = (log: SiteVisitLog) => {
    if (log.eventType === 'PRODUCT_VIEW' && log.productName) {
      return `Visualizou Peça: ${log.productName}`;
    }
    if (log.eventType === 'ADD_TO_CART' && log.productName) {
      return `Adicionou ao Carrinho: ${log.productName}`;
    }
    switch (log.pagePath) {
      case '/':
        return 'Catálogo Principal (Home)';
      case '/checkout':
        return 'Carrinho / Checkout';
      case '/login':
        return 'Tela de Login / Cadastro';
      case '/my-orders':
        return 'Meus Pedidos';
      case '/forgot-password':
        return 'Recuperação de Senha';
      default:
        return `Página: ${log.pagePath}`;
    }
  };

  const getEventBadgeStyle = (eventType: string) => {
    if (eventType === 'ADD_TO_CART') {
      return {
        bg: 'var(--success-glow)',
        color: 'var(--success)',
        border: 'rgba(0, 255, 136, 0.3)',
        label: 'CARRINHO'
      };
    }
    if (eventType === 'PRODUCT_VIEW') {
      return {
        bg: 'var(--primary-glow)',
        color: 'var(--primary)',
        border: 'rgba(0, 240, 255, 0.3)',
        label: 'VIU PEÇA 3D'
      };
    }
    return {
      bg: 'rgba(255, 255, 255, 0.06)',
      color: 'var(--text-secondary)',
      border: 'var(--border-color)',
      label: 'ACESSOU PÁGINA'
    };
  };

  const filteredLogs = (dashboard?.recentLogs || []).filter((log) => {
    if (filterType === 'IDENTIFIED' && !log.userId && !log.userName) return false;
    if (filterType === 'PRODUCTS' && log.eventType !== 'PRODUCT_VIEW') return false;
    if (filterType === 'CART' && log.eventType !== 'ADD_TO_CART') return false;

    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      (log.userName && log.userName.toLowerCase().includes(q)) ||
      (log.userEmail && log.userEmail.toLowerCase().includes(q)) ||
      (log.city && log.city.toLowerCase().includes(q)) ||
      (log.region && log.region.toLowerCase().includes(q)) ||
      (log.ipAddress && log.ipAddress.toLowerCase().includes(q)) ||
      (log.productName && log.productName.toLowerCase().includes(q)) ||
      (log.visitorId && log.visitorId.toLowerCase().includes(q)) ||
      (log.browser && log.browser.toLowerCase().includes(q)) ||
      (log.os && log.os.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ padding: '2rem', maxWidth: '1320px', margin: '0 auto' }}>
      {/* Cabeçalho */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <Link
              to="/admin/dashboard"
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', textDecoration: 'none' }}
            >
              <ArrowLeft size={14} /> Voltar às Vendas
            </Link>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.2rem 0.65rem',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 700,
                background: 'rgba(0, 255, 136, 0.12)',
                color: 'var(--success)',
                border: '1px solid rgba(0, 255, 136, 0.3)'
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--success)',
                  boxShadow: '0 0 8px var(--success)'
                }}
              />
              Monitoramento ao Vivo (Atualiza a cada 10s)
            </span>
          </div>
          <h2 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', marginTop: '0.4rem' }}>
            Radar de Visitantes & Acessos do Site
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Acompanhe quem entrou na loja, de qual cidade/dispositivo veio, quais peças 3D olhou e quem já fez login
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => fetchVisits(false)}
            disabled={loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Atualizar Agora
          </button>

          <button
            type="button"
            className="btn btn-danger"
            onClick={handleClearLogs}
            disabled={clearing}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Trash2 size={15} />
            Limpar Histórico
          </button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2.5rem'
        }}
      >
        <div
          className="glass-panel"
          style={{ padding: '1.35rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '1rem' }}
        >
          <div style={{ background: 'var(--success-glow)', color: 'var(--success)', padding: '0.75rem', borderRadius: '50%' }}>
            <Activity size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>
              Online Agora (Últ. 5 min)
            </span>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>
              {dashboard?.activeVisitorsLast5Min ?? 0}
            </span>
          </div>
        </div>

        <div
          className="glass-panel"
          style={{ padding: '1.35rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '1rem' }}
        >
          <div style={{ background: 'var(--primary-glow)', color: 'var(--primary)', padding: '0.75rem', borderRadius: '50%' }}>
            <Users size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>
              Visitantes Únicos (Hoje)
            </span>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>
              {dashboard?.uniqueVisitorsToday ?? 0}
            </span>
          </div>
        </div>

        <div
          className="glass-panel"
          style={{ padding: '1.35rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '1rem' }}
        >
          <div style={{ background: 'rgba(255, 183, 0, 0.12)', color: 'var(--warning)', padding: '0.75rem', borderRadius: '50%' }}>
            <Eye size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>
              Páginas / Peças Vistas Hoje
            </span>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>
              {dashboard?.totalEventsToday ?? 0}
            </span>
          </div>
        </div>

        <div
          className="glass-panel"
          style={{ padding: '1.35rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '1rem' }}
        >
          <div style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', padding: '0.75rem', borderRadius: '50%' }}>
            <UserCheck size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>
              Clientes Identificados (Total)
            </span>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>
              {dashboard?.identifiedUsersTotal ?? 0}{' '}
              <small style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                / {dashboard?.uniqueVisitorsTotal ?? 0} visitantes
              </small>
            </span>
          </div>
        </div>
      </div>

      {/* Ranking das Peças 3D Mais Vistas */}
      {dashboard && dashboard.topProductsViewed && dashboard.topProductsViewed.length > 0 && (
        <div
          className="glass-panel"
          style={{
            padding: '1.25rem 1.5rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '2rem',
            border: '1px solid var(--border-glow)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Sparkles size={18} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1.05rem', fontFamily: 'var(--font-display)', color: '#fff', margin: 0 }}>
              Peças 3D Mais Visitadas pelos Clientes
            </h3>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
              gap: '0.85rem'
            }}
          >
            {dashboard.topProductsViewed.map((prod, idx) => (
              <div
                key={idx}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}
              >
                <div style={{ overflow: 'hidden' }}>
                  <div
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: '#fff',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                    title={prod.productName}
                  >
                    #{idx + 1} {prod.productName}
                  </div>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
                    {prod.uniqueViewers} {prod.uniqueViewers === 1 ? 'visitante único' : 'visitantes únicos'}
                  </div>
                </div>
                <span
                  style={{
                    background: 'var(--primary-glow)',
                    color: 'var(--primary)',
                    padding: '0.2rem 0.55rem',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    flexShrink: 0
                  }}
                >
                  {prod.totalViews}x
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Barra de Filtros e Busca */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1.25rem',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: 'Todos os Acessos' },
            { id: 'IDENTIFIED', label: 'Apenas Clientes Logados' },
            { id: 'PRODUCTS', label: 'Viram Peças 3D' },
            { id: 'CART', label: 'Adicionaram ao Carrinho' }
          ].map((tab) => {
            const active = filterType === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id as any)}
                style={{
                  padding: '0.45rem 0.9rem',
                  borderRadius: '999px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: active ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                  background: active ? 'var(--primary-glow)' : 'rgba(255, 255, 255, 0.03)',
                  color: active ? 'var(--primary)' : 'var(--text-secondary)',
                  transition: 'var(--transition-fast)'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div style={{ position: 'relative', minWidth: '280px', flex: '1 1 280px', maxWidth: '400px' }}>
          <Search
            size={15}
            style={{
              position: 'absolute',
              left: '0.85rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }}
          />
          <input
            type="text"
            className="form-input"
            placeholder="Filtrar por cliente, cidade, IP, peça, navegador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.35rem', height: '38px', fontSize: '0.85rem' }}
          />
        </div>
      </div>

      {/* Tabela de Eventos */}
      <div className="table-container">
        <table className="premium-table">
          <thead>
            <tr>
              <th>Data / Hora</th>
              <th>Quem Acessou</th>
              <th>Ação / O que Viu</th>
              <th>Cidade / Localização (IP)</th>
              <th>Aparelho / Navegador</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                  Nenhum acesso encontrado para o filtro selecionado.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const badge = getEventBadgeStyle(log.eventType);
                const shortVisitor = log.visitorId ? log.visitorId.slice(-6).toUpperCase() : 'ANON';
                const isIdentified = Boolean(log.userName || log.userEmail);
                const isMobile = log.deviceType === 'Celular' || log.deviceType === 'Tablet';

                return (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.82rem', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                      {log.createdAt}
                    </td>

                    <td>
                      {isIdentified ? (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span
                              style={{
                                background: 'var(--success-glow)',
                                color: 'var(--success)',
                                border: '1px solid rgba(0, 255, 136, 0.3)',
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                padding: '0.1rem 0.45rem',
                                borderRadius: '4px'
                              }}
                            >
                              CLIENTE LOGADO
                            </span>
                            <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{log.userName}</strong>
                          </div>
                          {log.userEmail && (
                            <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                              {log.userEmail}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span
                              style={{
                                background: 'rgba(255, 255, 255, 0.06)',
                                color: 'var(--text-secondary)',
                                border: '1px solid var(--border-color)',
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                padding: '0.1rem 0.45rem',
                                borderRadius: '4px',
                                fontFamily: 'monospace'
                              }}
                            >
                              VISITANTE #{shortVisitor}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                            Ainda não fez login
                          </div>
                        </div>
                      )}
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            padding: '0.18rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            background: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          {log.eventType === 'ADD_TO_CART' ? (
                            <ShoppingCart size={11} />
                          ) : log.eventType === 'PRODUCT_VIEW' ? (
                            <Box size={11} />
                          ) : (
                            <Eye size={11} />
                          )}
                          {badge.label}
                        </span>
                        <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.86rem' }}>
                          {formatPageLabel(log)}
                        </span>
                      </div>
                      {log.referrer && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          Origem: {log.referrer}
                        </div>
                      )}
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#fff', fontSize: '0.85rem', fontWeight: 600 }}>
                        <MapPin size={13} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                        <span>
                          {log.city && log.city !== 'Não identificado'
                            ? `${log.city}${log.region ? ` / ${log.region}` : ''}`
                            : 'Local não identificado'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', fontFamily: 'monospace', marginTop: '0.15rem' }}>
                        IP: {log.ipAddress || '—'} {log.isp ? `• ${log.isp}` : ''}
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#fff', fontSize: '0.84rem' }}>
                        {isMobile ? (
                          <Smartphone size={14} style={{ color: 'var(--primary)' }} />
                        ) : (
                          <Monitor size={14} style={{ color: 'var(--primary)' }} />
                        )}
                        <strong>{log.deviceType || 'Dispositivo'}</strong>
                        <span style={{ color: 'var(--text-secondary)' }}>• {log.os || 'SO'}</span>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Globe size={11} />
                        Navegador: {log.browser || ' Padrão'}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Visitors;
