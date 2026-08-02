import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, User, Mail, Lock, ArrowLeft } from 'lucide-react';

export const Login: React.FC = () => {
  const { user, loginLocal, registerLocal } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redireciona para home se já estiver logado
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);
    try {
      if (isRegistering) {
        if (!name.trim() || !email.trim() || !password.trim()) return;
        await registerLocal(name.trim(), email.trim(), password.trim());
      } else {
        if (!email.trim() || !password.trim()) return;
        await loginLocal(email.trim(), password.trim());
      }
      navigate('/');
    } catch (error: any) {
      setLoginError(error.response?.data?.message || 'Falha na autenticação');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    alert('Recuperação de senha será implementada em breve! (TODO)');
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 1.5rem',
      minHeight: '80vh'
    }}>
      <div className="glass-panel" style={{
        padding: '2.5rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--primary-glow-strong)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
        position: 'relative'
      }}>
        {/* Voltar para Home link */}
        <button 
          onClick={() => navigate('/')}
          style={{
            position: 'absolute',
            top: '1.25rem',
            left: '1.25rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontSize: '0.8rem',
            transition: 'var(--transition-fast)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          <ArrowLeft size={14} />
          Voltar
        </button>

        {/* Cabeçalho */}
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'var(--primary-glow)',
            color: 'var(--primary)',
            marginBottom: '0.75rem'
          }}>
            <LogIn size={24} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', margin: 0 }}>
            {isRegistering ? 'Criar Cadastro' : 'Acessar Conta'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {isRegistering 
              ? 'Preencha os dados abaixo para registrar-se' 
              : 'Entre com seu e-mail e senha para continuar'
            }
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {isRegistering && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <User size={14} style={{ color: 'var(--primary)' }} />
                Nome Completo
              </label>
              <input 
                type="text" 
                placeholder="Ex: Patrick Moura" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
                required
                disabled={loading}
              />
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Mail size={14} style={{ color: 'var(--primary)' }} />
              E-mail
            </label>
            <input 
              type="email" 
              placeholder="seuemail@exemplo.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              required
              disabled={loading}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Lock size={14} style={{ color: 'var(--primary)' }} />
              Senha
            </label>
            <input 
              type="password" 
              placeholder="******" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              required
              minLength={6}
              disabled={loading}
            />
          </div>

          {loginError && (
            <p style={{ color: 'var(--danger)', fontSize: '0.85rem', margin: 0, textAlign: 'center' }}>
              {loginError}
            </p>
          )}

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', fontWeight: 700 }}
            disabled={loading}
          >
            {loading ? 'Aguarde...' : (isRegistering ? 'Cadastrar' : 'Entrar')}
          </button>
        </form>

        {/* Links adicionais */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.6rem',
          fontSize: '0.85rem',
          borderTop: '1px solid var(--border-color)',
          paddingTop: '1rem',
          marginTop: '0.5rem'
        }}>
          {/* Link para esqueci a senha */}
          <a 
            href="#" 
            onClick={handleForgotPassword}
            style={{
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              transition: 'var(--transition-fast)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            Esqueceu sua senha?
          </a>

          {/* Link para cadastrar/fazer login */}
          <a 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              setIsRegistering(!isRegistering);
              setLoginError('');
            }}
            style={{
              color: 'var(--primary)',
              textDecoration: 'none',
              fontWeight: 600,
              transition: 'var(--transition-fast)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.textShadow = '0 0 8px var(--primary-glow)'}
            onMouseLeave={(e) => e.currentTarget.style.textShadow = 'none'}
          >
            {isRegistering ? 'Já tem conta? Faça Login' : 'Não tem conta? Cadastrar login'}
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;
