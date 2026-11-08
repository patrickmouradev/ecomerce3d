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
  Sparkles,
  UserX,
  EyeOff,
  X,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

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

  const { user: currentUser } = useAuth();

  // Lista de e-mails ou nomes de usuários a excluir da listagem
  const [excludedUsers, setExcludedUsers] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('3dprintpng_excluded_visitors');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Habilitar ou desabilitar o filtro de exclusão
  const [excludeFilterActive, setExcludeFilterActive] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('3dprintpng_filter_exclude_enabled');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [showExcludePanel, setShowExcludePanel] = useState(false);
  const [newExcludeInput, setNewExcludeInput] = useState('');

  // Persistência das preferências de exclusão no localStorage
  useEffect(() => {
    try {
      localStorage.setItem('3dprintpng_excluded_visitors', JSON.stringify(excludedUsers));
    } catch (e) {}
  }, [excludedUsers]);

  useEffect(() => {
    try {
      localStorage.setItem('3dprintpng_filter_exclude_enabled', JSON.stringify(excludeFilterActive));
    } catch (e) {}
  }, [excludeFilterActive]);

  const handleToggleExcludeUser = (identifier: string) => {
    if (!identifier) return;
    const clean = identifier.trim().toLowerCase();
    setExcludedUsers((prev) => {
      const exists = prev.some((item) => item.toLowerCase() === clean);
      if (exists) {
        return prev.filter((item) => item.toLowerCase() !== clean);
      } else {
        return [...prev, identifier.trim()];
      }
    });
  };

  const handleAddCustomExclude = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExcludeInput.trim()) return;
    handleToggleExcludeUser(newExcludeInput.trim());
    setNewExcludeInput('');
  };

  const isUserExcluded = (userName?: string, userEmail?: string) => {
    if (!excludeFilterActive || excludedUsers.length === 0) return false;
    const nameLower = (userName || '').toLowerCase();
    const emailLower = (userEmail || '').toLowerCase();
    return excludedUsers.some((ex) => {
      const exLower = ex.toLowerCase();
      return (emailLower && emailLower === exLower) || (nameLower && nameLower === exLower);
    });
  };

  // Identifica todos os usuários logados presentes nos logs recentes
  const identifiedUsersInLogs = React.useMemo(() => {
    const map = new Map<string, { name?: string; email?: string }>();
    (dashboard?.recentLogs || []).forEach((log) => {
      if (log.userEmail || log.userName) {
        const key = (log.userEmail || log.userName || '').toLowerCase();
        if (!map.has(key)) {
          map.set(key, { name: log.userName, email: log.userEmail });
        }
      }
    });
    return Array.from(map.values());
  }, [dashboard?.recentLogs]);

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
    if (excludeFilterActive && isUserExcluded(log.userName, log.userEmail)) {
      return false;
    }
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
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setShowExcludePanel((prev) => !prev)}
            className="btn btn-secondary"
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '999px',
              fontSize: '0.8rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: showExcludePanel || (excludeFilterActive && excludedUsers.length > 0)
                ? 'rgba(255, 170, 0, 0.15)'
                : undefined,
              borderColor: excludeFilterActive && excludedUsers.length > 0 ? '#ffaa00' : undefined,
              color: excludeFilterActive && excludedUsers.length > 0 ? '#ffaa00' : 'var(--text-secondary)'
            }}
            title="Configurar exclusão de usuários da listagem"
          >
            <UserX size={15} />
            <span>Ocultar Usuários ({excludedUsers.length})</span>
            {excludeFilterActive && excludedUsers.length > 0 && (
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#ffaa00',
                  boxShadow: '0 0 6px #ffaa00'
                }}
              />
            )}
          </button>
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

      {/* Painel Expansível de Exclusão de Usuários */}
      {showExcludePanel && (
        <div
          className="glass-panel"
          style={{
            padding: '1.25rem 1.5rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            border: '1px solid rgba(255, 170, 0, 0.35)',
            background: 'rgba(255, 170, 0, 0.03)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <UserX size={18} style={{ color: '#ffaa00' }} />
              <h4 style={{ margin: 0, fontSize: '1rem', color: '#fff', fontWeight: 700 }}>
                Filtrar e Ocultar Usuários Específicos
              </h4>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: excludeFilterActive ? 'var(--success)' : 'var(--text-muted)'
                }}
              >
                <input
                  type="checkbox"
                  checked={excludeFilterActive}
                  onChange={(e) => setExcludeFilterActive(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--success)', cursor: 'pointer' }}
                />
                Filtro de Exclusão Ativo
              </label>

              <button
                type="button"
                onClick={() => setShowExcludePanel(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 1rem' }}>
            Marque os usuários abaixo ou adicione e-mails para que as atividades deles não poluam a listagem de clientes reais.
          </p>

          {/* Atalho Meu Usuário */}
          {currentUser?.email && (
            <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Meu usuário:</span>
              <button
                type="button"
                className="btn btn-secondary"
                style={{
                  padding: '0.3rem 0.75rem',
                  fontSize: '0.78rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  borderRadius: 'var(--radius-sm)',
                  borderColor: excludedUsers.some((u) => u.toLowerCase() === currentUser.email.toLowerCase())
                    ? '#ffaa00'
                    : undefined,
                  color: excludedUsers.some((u) => u.toLowerCase() === currentUser.email.toLowerCase())
                    ? '#ffaa00'
                    : '#fff'
                }}
                onClick={() => handleToggleExcludeUser(currentUser.email)}
              >
                {excludedUsers.some((u) => u.toLowerCase() === currentUser.email.toLowerCase()) ? (
                  <>
                    <Check size={13} style={{ color: '#ffaa00' }} />
                    Meu Usuário está Ocultado ({currentUser.email})
                  </>
                ) : (
                  <>
                    <EyeOff size={13} />
                    Ocultar Meu Usuário ({currentUser.email})
                  </>
                )}
              </button>
            </div>
          )}

          {/* Usuários identificados detectados recentemente */}
          {identifiedUsersInLogs.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.4rem' }}>
                Usuários Logados Detectados nos Acessos Recentes:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {identifiedUsersInLogs.map((u, i) => {
                  const identifier = u.email || u.name || '';
                  if (!identifier) return null;
                  const isExcluded = excludedUsers.some((item) => item.toLowerCase() === identifier.toLowerCase());
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleToggleExcludeUser(identifier)}
                      className="btn"
                      style={{
                        padding: '0.25rem 0.65rem',
                        fontSize: '0.75rem',
                        borderRadius: '20px',
                        background: isExcluded ? 'rgba(255, 170, 0, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid ' + (isExcluded ? '#ffaa00' : 'var(--border-color)'),
                        color: isExcluded ? '#ffaa00' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      {isExcluded ? <Check size={12} /> : <EyeOff size={12} />}
                      <span>{u.name || u.email}</span>
                      {u.email && u.name && <span style={{ opacity: 0.6, fontSize: '0.7rem' }}>({u.email})</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Adicionar por e-mail manual */}
          <form onSubmit={handleAddCustomExclude} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', maxWidth: '500px' }}>
            <input
              type="text"
              placeholder="Digitar e-mail ou nome para ocultar..."
              value={newExcludeInput}
              onChange={(e) => setNewExcludeInput(e.target.value)}
              className="form-input"
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.82rem', flex: 1 }}
            />
            <button
              type="submit"
              className="btn btn-secondary"
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
            >
              Adicionar
            </button>
          </form>

          {/* Chips dos usuários atualmente ocultados */}
          {excludedUsers.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ocultados atualmente:</span>
              {excludedUsers.map((u, i) => (
                <span
                  key={i}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.74rem',
                    background: 'rgba(255, 170, 0, 0.15)',
                    color: '#ffaa00',
                    border: '1px solid rgba(255, 170, 0, 0.3)'
                  }}
                >
                  {u}
                  <button
                    type="button"
                    onClick={() => handleToggleExcludeUser(u)}
                    style={{ background: 'none', border: 'none', color: '#ffaa00', cursor: 'pointer', padding: 0 }}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={() => setExcludedUsers([])}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.72rem',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  marginLeft: '0.5rem'
                }}
              >
                Limpar todos
              </button>
            </div>
          )}
        </div>
      )}

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
                            <button
                              type="button"
                              onClick={() => handleToggleExcludeUser(log.userEmail || log.userName || '')}
                              title={
                                isUserExcluded(log.userName, log.userEmail)
                                  ? 'Restaurar visualização deste usuário'
                                  : 'Ocultar este usuário da listagem de visitantes'
                              }
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '2px 4px',
                                color: isUserExcluded(log.userName, log.userEmail) ? '#ffaa00' : 'var(--text-muted)',
                                display: 'inline-flex',
                                alignItems: 'center'
                              }}
                            >
                              <EyeOff size={13} />
                            </button>
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
