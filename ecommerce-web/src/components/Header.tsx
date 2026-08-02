import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, LogOut, Shield, ChevronDown, Check, Edit2, LogIn } from 'lucide-react';
import logoImg from '../assets/logo-loja.jpg';

export const Header: React.FC = () => {
  const { user, logout, activeRole, roles, switchProfile, updateProfileDetails } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || '');
  const [showProfileSwitcher, setShowProfileSwitcher] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Fecha o dropdown ao clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
        setIsEditing(false);
        setShowProfileSwitcher(false);
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
    navigate('/');
  };

  const hasMultipleRoles = roles.length > 1;

  // Verifica se o perfil ativo tem acesso administrativo
  const isAdminOrFinancial = activeRole === 'ADMINISTRADOR' || activeRole === 'FINANCEIRO';

  return (
    <header className="glass-panel" style={{
      position: 'sticky',
      top: 0,
      zIndex: 999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.75rem 2rem',
      borderBottom: '1px solid var(--border-color)',
      borderRadius: '0 0 var(--radius-md) var(--radius-md)'
    }}>
      {/* Logo e Nome da Loja */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <img 
          src={logoImg} 
          alt="3DPrintPNG Logo" 
          style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--primary)' }} 
        />
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.25rem',
          fontWeight: 800,
          background: 'linear-gradient(to right, #ffffff, var(--primary))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          3DPrintPNG
        </span>
      </Link>

      {/* Navegação */}
      <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <Link to="/" style={{ fontSize: '0.95rem', fontWeight: 500, transition: 'var(--transition-fast)' }} className="nav-link">
          Catálogo
        </Link>
        
        {isAdminOrFinancial && (
          <>
            <Link to="/admin/products" style={{ fontSize: '0.95rem', fontWeight: 500 }} className="nav-link">
              Produtos
            </Link>
            <Link to="/admin/filaments" style={{ fontSize: '0.95rem', fontWeight: 500 }} className="nav-link">
              Filamentos
            </Link>
            <Link to="/admin/parameters" style={{ fontSize: '0.95rem', fontWeight: 500 }} className="nav-link">
              Parâmetros
            </Link>
            <Link to="/admin/basic-costs" style={{ fontSize: '0.95rem', fontWeight: 500 }} className="nav-link">
              Custos Produção
            </Link>
            <Link to="/admin/dashboard" style={{ fontSize: '0.95rem', fontWeight: 500 }} className="nav-link">
              Painel
            </Link>
          </>
        )}
      </nav>

      {/* Menu do Usuário */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {user ? (
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            {/* Nome do Usuário que abre o menu */}
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
                fontSize: '0.9rem',
                transition: 'var(--transition-fast)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = dropdownOpen ? 'var(--primary)' : 'var(--border-color)'}
            >
              <User size={16} style={{ color: 'var(--primary)' }} />
              <span>{user.name}</span>
              <span style={{
                fontSize: '0.75rem',
                background: 'var(--primary-glow)',
                color: 'var(--primary)',
                padding: '0.1rem 0.4rem',
                borderRadius: '4px',
                fontWeight: 700,
                marginLeft: '0.25rem'
              }}>
                {activeRole}
              </span>
              <ChevronDown size={14} style={{ opacity: 0.6, transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {/* Menu Popover (Dropdown) */}
            {dropdownOpen && (
              <div className="glass-panel" style={{
                position: 'absolute',
                top: 'calc(100% + 0.5rem)',
                right: 0,
                width: '280px',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                border: '1px solid var(--border-glow)',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
                zIndex: 1000
              }}>
                {/* Cabeçalho do Dropdown: Visualizar e Editar Dados */}
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
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                      >
                        <Edit2 size={12} />
                      </button>
                    </div>
                  )}
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>{user.email}</p>
                </div>

                {/* Alternar Perfil de Acesso */}
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
                      <div style={{
                        marginTop: '0.5rem',
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.2rem'
                      }}>
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

                {/* Opção Logout */}
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

      {/* Adição rápida de estilos hover no documento */}
      <style>{`
        .nav-link {
          color: var(--text-secondary);
        }
        .nav-link:hover {
          color: var(--primary);
          text-shadow: 0 0 10px var(--primary-glow);
        }
      `}</style>
    </header>
  );
};
export default Header;
