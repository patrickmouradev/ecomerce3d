import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  User,
  LogOut,
  Shield,
  ChevronDown,
  Check,
  Edit2,
  LogIn,
  Box,
  Layers,
  Sliders,
  DollarSign,
  Paperclip,
  ShoppingCart,
  Package,
  Menu,
  X,
  LayoutDashboard,
  Grid,
  Activity,
  Star
} from 'lucide-react';
import logoImg from '../assets/logo-loja.jpg';

export const Header: React.FC = () => {
  const { user, logout, activeRole, roles, switchProfile, updateProfileDetails } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileAdminExpanded, setMobileAdminExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || '');
  const [showProfileSwitcher, setShowProfileSwitcher] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const adminDropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Fecha o menu lateral mobile automaticamente ao mudar de rota
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Bloqueia o scroll do fundo quando o menu lateral mobile está aberto
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Atualiza contador de itens do carrinho em tempo real
  useEffect(() => {
    const updateBadge = () => {
      try {
        const items = JSON.parse(localStorage.getItem('3dprintpng_cart') || '[]');
        const total = items.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0);
        setCartCount(total);
      } catch {
        setCartCount(0);
      }
    };
    updateBadge();
    window.addEventListener('cart_updated', updateBadge);
    return () => window.removeEventListener('cart_updated', updateBadge);
  }, []);

  // Fecha os dropdowns desktop ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
        setIsEditing(false);
        setShowProfileSwitcher(false);
      }
      if (adminDropdownRef.current && !adminDropdownRef.current.contains(event.target as Node)) {
        setAdminDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (user) {
      setEditedName(user.name);
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editedName.trim()) {
      await updateProfileDetails(editedName.trim());
      setIsEditing(false);
    }
  };

  const handleRoleSwitch = async (role: string) => {
    await switchProfile(role);
    setShowProfileSwitcher(false);
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    navigate('/');
  };

  const hasMultipleRoles = roles.length > 1;
  const isAdminOrFinancial = activeRole === 'ADMINISTRADOR' || activeRole === 'FINANCEIRO';

  return (
    <>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.7rem 1.25rem',
          backgroundColor: '#090b0e',
          borderBottom: '1px solid var(--border-color)',
          borderRadius: '0 0 var(--radius-md) var(--radius-md)',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.75)',
          gap: '0.75rem'
        }}
      >
        {/* Logo e Nome da Loja */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0 }}>
          <img
            src={logoImg}
            alt="3DPrintPNG Logo"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '1px solid var(--primary)'
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.15rem',
              fontWeight: 800,
              background: 'linear-gradient(to right, #ffffff, var(--primary))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            3DPrintPNG
          </span>
        </Link>

        {/* Navegação Desktop (oculta no celular) */}
        <nav className="header-desktop-nav">
          <Link to="/" style={{ fontSize: '0.95rem', fontWeight: 500, transition: 'var(--transition-fast)' }} className="nav-link">
            Catálogo
          </Link>
          {user && (
            <Link to="/my-orders" style={{ fontSize: '0.95rem', fontWeight: 500, transition: 'var(--transition-fast)' }} className="nav-link">
              Meus Pedidos
            </Link>
          )}

          {isAdminOrFinancial && (
            <>
              <div ref={adminDropdownRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: 'none',
                    border: 'none',
                    color: adminDropdownOpen ? 'var(--primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-primary)',
                    fontWeight: 500,
                    fontSize: '0.95rem',
                    padding: 0,
                    transition: 'var(--transition-fast)'
                  }}
                >
                  <span>Administração</span>
                  <ChevronDown size={14} style={{ transform: adminDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>

                {adminDropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 0.75rem)',
                      left: 0,
                      width: '210px',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.5rem',
                      backgroundColor: '#0d1117',
                      border: '1px solid var(--border-glow)',
                      boxShadow: '0 12px 36px rgba(0, 0, 0, 0.85)',
                      zIndex: 1000,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem'
                    }}
                  >
                    <Link
                      to="/admin/products"
                      onClick={() => setAdminDropdownOpen(false)}
                      className="dropdown-item"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        padding: '0.6rem 0.8rem',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-primary)',
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        fontWeight: 500
                      }}
                    >
                      <Box size={15} style={{ color: 'var(--primary)' }} />
                      Produtos
                    </Link>

                    <Link
                      to="/admin/filaments"
                      onClick={() => setAdminDropdownOpen(false)}
                      className="dropdown-item"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        padding: '0.6rem 0.8rem',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-primary)',
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        fontWeight: 500
                      }}
                    >
                      <Layers size={15} style={{ color: 'var(--primary)' }} />
                      Filamentos
                    </Link>

                    <Link
                      to="/admin/accessories"
                      onClick={() => setAdminDropdownOpen(false)}
                      className="dropdown-item"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        padding: '0.6rem 0.8rem',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-primary)',
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        fontWeight: 500
                      }}
                    >
                      <Paperclip size={15} style={{ color: 'var(--primary)' }} />
                      Acessórios
                    </Link>

                    <Link
                      to="/admin/parameters"
                      onClick={() => setAdminDropdownOpen(false)}
                      className="dropdown-item"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        padding: '0.6rem 0.8rem',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-primary)',
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        fontWeight: 500
                      }}
                    >
                      <Sliders size={15} style={{ color: 'var(--primary)' }} />
                      Parâmetros
                    </Link>

                    <Link
                      to="/admin/basic-costs"
                      onClick={() => setAdminDropdownOpen(false)}
                      className="dropdown-item"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        padding: '0.6rem 0.8rem',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-primary)',
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        fontWeight: 500
                      }}
                    >
                      <DollarSign size={15} style={{ color: 'var(--primary)' }} />
                      Custo Produção
                    </Link>

                    <Link
                      to="/admin/visitors"
                      onClick={() => setAdminDropdownOpen(false)}
                      className="dropdown-item"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        padding: '0.6rem 0.8rem',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-primary)',
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        fontWeight: 500
                      }}
                    >
                      <Activity size={15} style={{ color: 'var(--success)' }} />
                      Visitantes do Site
                    </Link>

                    <Link
                      to="/admin/reviews"
                      onClick={() => setAdminDropdownOpen(false)}
                      className="dropdown-item"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        padding: '0.6rem 0.8rem',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-primary)',
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        fontWeight: 500
                      }}
                    >
                      <Star size={15} style={{ color: '#ffc107' }} />
                      Avaliações
                    </Link>
                  </div>
                )}
              </div>

              <Link to="/admin/dashboard" style={{ fontSize: '0.95rem', fontWeight: 500 }} className="nav-link">
                Dashboard
              </Link>
              <Link to="/admin/visitors" style={{ fontSize: '0.95rem', fontWeight: 500 }} className="nav-link">
                Visitantes
              </Link>
            </>
          )}
        </nav>

        {/* Ações Desktop (Carrinho + Login/Perfil) */}
        <div className="header-desktop-actions">
          <Link
            to="/checkout"
            title="Ver Carrinho e Finalizar Compra"
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: cartCount > 0 ? 'rgba(0, 240, 255, 0.08)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${cartCount > 0 ? 'var(--primary)' : 'var(--border-color)'}`,
              padding: '0.5rem 0.9rem',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              textDecoration: 'none',
              fontSize: '0.85rem',
              fontWeight: 600,
              transition: 'var(--transition-fast)'
            }}
          >
            <ShoppingCart size={16} style={{ color: 'var(--primary)' }} />
            <span>Carrinho</span>
            {cartCount > 0 && (
              <span
                style={{
                  background: 'var(--primary)',
                  color: '#000',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '0.05rem 0.45rem',
                  borderRadius: '12px'
                }}
              >
                {cartCount}
              </span>
            )}
          </Link>

          {user ? (
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-color)',
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-primary)',
                  fontWeight: 500,
                  fontSize: '0.9rem'
                }}
              >
                <User size={16} style={{ color: 'var(--primary)' }} />
                <span>{user.name}</span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    background: 'var(--primary-glow)',
                    color: 'var(--primary)',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '4px',
                    fontWeight: 700,
                    marginLeft: '0.25rem'
                  }}
                >
                  {activeRole}
                </span>
                <ChevronDown size={14} style={{ opacity: 0.6, transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>

              {dropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 0.5rem)',
                    right: 0,
                    width: '280px',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem',
                    backgroundColor: '#0d1117',
                    border: '1px solid var(--border-glow)',
                    boxShadow: '0 12px 36px rgba(0, 0, 0, 0.85)',
                    zIndex: 1000
                  }}
                >
                  <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                    <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.25rem' }}>
                      Dados do Usuário
                    </p>

                    {isEditing ? (
                      <form onSubmit={handleSaveProfile} style={{ display: 'flex', gap: '0.25rem', marginTop: '0.5rem' }}>
                        <input
                          type="text"
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          className="form-input"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                          autoFocus
                        />
                        <button type="submit" className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)' }}>
                          <Check size={12} />
                        </button>
                      </form>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{user.name}</span>
                        <button
                          onClick={() => setIsEditing(true)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                        >
                          <Edit2 size={12} />
                        </button>
                      </div>
                    )}
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>{user.email}</p>
                  </div>

                  {hasMultipleRoles && (
                    <div style={{ marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                      <button
                        onClick={() => setShowProfileSwitcher(!showProfileSwitcher)}
                        className="btn btn-secondary"
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          fontSize: '0.85rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Shield size={14} style={{ color: 'var(--primary)' }} />
                          Trocar Perfil
                        </span>
                        <ChevronDown size={12} />
                      </button>

                      {showProfileSwitcher && (
                        <div
                          style={{
                            marginTop: '0.5rem',
                            background: 'rgba(0,0,0,0.2)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '0.25rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.2rem'
                          }}
                        >
                          {roles.map((role) => (
                            <button
                              key={role}
                              onClick={() => handleRoleSwitch(role)}
                              style={{
                                padding: '0.4rem 0.75rem',
                                background: role === activeRole ? 'var(--primary-glow)' : 'none',
                                border: 'none',
                                color: role === activeRole ? 'var(--primary)' : 'var(--text-primary)',
                                borderRadius: '4px',
                                textAlign: 'left',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: role === activeRole ? 700 : 500,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}
                            >
                              {role}
                              {role === activeRole && <Check size={12} />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <Link
                    to="/my-orders"
                    onClick={() => setDropdownOpen(false)}
                    className="btn btn-secondary"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.5rem',
                      textDecoration: 'none'
                    }}
                  >
                    <Package size={14} style={{ color: 'var(--primary)' }} />
                    Meus Pedidos
                  </Link>

                  <button
                    onClick={logout}
                    className="btn btn-danger"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <LogOut size={14} />
                    Sair da Conta
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="btn btn-primary"
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                textDecoration: 'none'
              }}
            >
              <LogIn size={14} />
              Faça seu login
            </Link>
          )}
        </div>

        {/* Ações Mobile (Botão Carrinho Compacto + Botão Sanduíche Lateral) */}
        <div className="header-mobile-actions">
          <Link
            to="/checkout"
            title="Ver Carrinho"
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: cartCount > 0 ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${cartCount > 0 ? 'var(--primary)' : 'var(--border-color)'}`,
              padding: '0.45rem 0.7rem',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              textDecoration: 'none',
              fontSize: '0.82rem',
              fontWeight: 600
            }}
          >
            <ShoppingCart size={16} style={{ color: 'var(--primary)' }} />
            {cartCount > 0 && (
              <span
                style={{
                  background: 'var(--primary)',
                  color: '#000',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '0.02rem 0.4rem',
                  borderRadius: '10px'
                }}
              >
                {cartCount}
              </span>
            )}
          </Link>

          <button
            type="button"
            aria-label="Abrir Menu Lateral"
            onClick={() => setMobileMenuOpen(true)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(0, 240, 255, 0.08)',
              border: '1px solid var(--primary)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <Menu size={20} />
          </button>
        </div>

        <style>{`
          .nav-link {
            color: var(--text-secondary);
          }
          .nav-link:hover {
            color: var(--primary);
            text-shadow: 0 0 10px var(--primary-glow);
          }
          .dropdown-item:hover {
            background: rgba(0, 240, 255, 0.08) !important;
            color: var(--primary) !important;
          }
        `}</style>
      </header>

      {/* =========================================================================
          MENU LATERAL MOBILE (DRAWER DESLIZANTE COM BOTÃO SANDUÍCHE)
         ========================================================================= */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(4, 6, 10, 0.78)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            zIndex: 2500,
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <aside
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: 'min(85vw, 320px)',
              backgroundColor: '#0b0e14',
              borderLeft: '1px solid var(--border-glow)',
              boxShadow: '-12px 0 40px rgba(0, 0, 0, 0.85)',
              display: 'flex',
              flexDirection: 'column',
              padding: '1.25rem',
              overflowY: 'auto',
              zIndex: 2501,
              animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* Topo do Menu Lateral */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '1rem',
                marginBottom: '1rem',
                borderBottom: '1px solid var(--border-color)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <img
                  src={logoImg}
                  alt="3DPrintPNG"
                  style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid var(--primary)' }}
                />
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.05rem', color: '#fff' }}>
                  Menu 3DPrintPNG
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Bloco do Usuário ou Botão de Login no Topo do Menu Lateral */}
            {user ? (
              <div
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-color)',
                  marginBottom: '1.25rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Conta Conectada
                  </span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      background: 'var(--primary-glow)',
                      color: 'var(--primary)',
                      padding: '0.1rem 0.45rem',
                      borderRadius: '4px',
                      fontWeight: 700
                    }}
                  >
                    {activeRole}
                  </span>
                </div>

                {isEditing ? (
                  <form onSubmit={handleSaveProfile} style={{ display: 'flex', gap: '0.35rem', marginTop: '0.4rem' }}>
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="form-input"
                      style={{ padding: '0.35rem 0.6rem', fontSize: '0.85rem' }}
                      autoFocus
                    />
                    <button type="submit" className="btn btn-primary" style={{ padding: '0.35rem 0.6rem' }}>
                      <Check size={14} />
                    </button>
                  </form>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <strong style={{ fontSize: '0.95rem', color: '#fff' }}>{user.name}</strong>
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem' }}
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                )}
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem', wordBreak: 'break-all' }}>
                  {user.email}
                </div>

                {hasMultipleRoles && (
                  <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: 600 }}>
                      Alternar Perfil:
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {roles.map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => handleRoleSwitch(role)}
                          style={{
                            padding: '0.3rem 0.6rem',
                            borderRadius: '6px',
                            border: role === activeRole ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                            background: role === activeRole ? 'var(--primary-glow)' : 'rgba(0,0,0,0.25)',
                            color: role === activeRole ? 'var(--primary)' : 'var(--text-secondary)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  marginBottom: '1.25rem',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <LogIn size={18} />
                Faça seu Login / Cadastrar
              </Link>
            )}

            {/* Links de Navegação Principal */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, padding: '0 0.4rem', marginBottom: '0.2rem' }}>
                Navegação
              </span>

              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  background: location.pathname === '/' ? 'rgba(0, 240, 255, 0.1)' : 'transparent',
                  color: location.pathname === '/' ? 'var(--primary)' : 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: '0.92rem'
                }}
              >
                <Grid size={18} style={{ color: 'var(--primary)' }} />
                Catálogo de Peças 3D
              </Link>

              <Link
                to="/checkout"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  background: location.pathname === '/checkout' ? 'rgba(0, 240, 255, 0.1)' : 'transparent',
                  color: location.pathname === '/checkout' ? 'var(--primary)' : 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: '0.92rem'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <ShoppingCart size={18} style={{ color: 'var(--primary)' }} />
                  Carrinho de Compras
                </span>
                {cartCount > 0 && (
                  <span
                    style={{
                      background: 'var(--primary)',
                      color: '#000',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      padding: '0.1rem 0.5rem',
                      borderRadius: '12px'
                    }}
                  >
                    {cartCount}
                  </span>
                )}
              </Link>

              {user && (
                <Link
                  to="/my-orders"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    background: location.pathname === '/my-orders' ? 'rgba(0, 240, 255, 0.1)' : 'transparent',
                    color: location.pathname === '/my-orders' ? 'var(--primary)' : 'var(--text-primary)',
                    fontWeight: 600,
                    fontSize: '0.92rem'
                  }}
                >
                  <Package size={18} style={{ color: 'var(--primary)' }} />
                  Meus Pedidos & Chat PIX
                </Link>
              )}
            </div>

            {/* Seção de Administração no Menu Lateral Mobile */}
            {isAdminOrFinancial && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginBottom: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setMobileAdminExpanded(!mobileAdminExpanded)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'none',
                    border: 'none',
                    padding: '0.4rem 0.4rem',
                    color: 'var(--text-muted)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    cursor: 'pointer'
                  }}
                >
                  <span>Módulo de Administração</span>
                  <ChevronDown size={15} style={{ transform: mobileAdminExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>

                <Link
                  to="/admin/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.7rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    background: location.pathname === '/admin/dashboard' ? 'rgba(0, 240, 255, 0.1)' : 'transparent',
                    color: location.pathname === '/admin/dashboard' ? 'var(--primary)' : 'var(--text-primary)',
                    fontWeight: 600,
                    fontSize: '0.9rem'
                  }}
                >
                  <LayoutDashboard size={17} style={{ color: 'var(--primary)' }} />
                  Painel de Vendas / Chat PIX
                </Link>

                <Link
                  to="/admin/visitors"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.7rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    background: location.pathname === '/admin/visitors' ? 'rgba(0, 255, 136, 0.12)' : 'transparent',
                    color: location.pathname === '/admin/visitors' ? 'var(--success)' : 'var(--text-primary)',
                    fontWeight: 600,
                    fontSize: '0.9rem'
                  }}
                >
                  <Activity size={17} style={{ color: 'var(--success)' }} />
                  Radar de Visitantes & Acessos
                </Link>

                {(mobileAdminExpanded || location.pathname.startsWith('/admin/')) && (
                  <>
                    <Link
                      to="/admin/products"
                      onClick={() => setMobileMenuOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-primary)',
                        fontSize: '0.88rem'
                      }}
                    >
                      <Box size={16} style={{ color: 'var(--primary)' }} />
                      Produtos
                    </Link>
                    <Link
                      to="/admin/filaments"
                      onClick={() => setMobileMenuOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-primary)',
                        fontSize: '0.88rem'
                      }}
                    >
                      <Layers size={16} style={{ color: 'var(--primary)' }} />
                      Filamentos
                    </Link>
                    <Link
                      to="/admin/accessories"
                      onClick={() => setMobileMenuOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-primary)',
                        fontSize: '0.88rem'
                      }}
                    >
                      <Paperclip size={16} style={{ color: 'var(--primary)' }} />
                      Acessórios
                    </Link>
                    <Link
                      to="/admin/parameters"
                      onClick={() => setMobileMenuOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-primary)',
                        fontSize: '0.88rem'
                      }}
                    >
                      <Sliders size={16} style={{ color: 'var(--primary)' }} />
                      Parâmetros
                    </Link>
                    <Link
                      to="/admin/basic-costs"
                      onClick={() => setMobileMenuOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-primary)',
                        fontSize: '0.88rem'
                      }}
                    >
                      <DollarSign size={16} style={{ color: 'var(--primary)' }} />
                      Custo Produção
                    </Link>
                  </>
                )}
              </div>
            )}

            {/* Botão Sair no Rodapé do Menu Lateral */}
            {user && (
              <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="btn btn-danger"
                  style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem', fontWeight: 700 }}
                >
                  <LogOut size={16} />
                  Sair da Conta
                </button>
              </div>
            )}
          </aside>
        </div>
      )}
    </>
  );
};
export default Header;
