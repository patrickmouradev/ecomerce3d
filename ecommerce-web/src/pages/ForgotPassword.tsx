import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Mail, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post(`/api/auth/forgot-password?email=${encodeURIComponent(email.trim())}`);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Falha ao enviar e-mail de recuperação');
    } finally {
      setLoading(false);
    }
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
        {/* Voltar link */}
        <button 
          onClick={() => navigate('/login')}
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
          Voltar para Login
        </button>

        {/* Cabeçalho */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
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
            {success ? <CheckCircle2 size={24} style={{ color: 'var(--success)' }} /> : <KeyRound size={24} />}
          </div>
          <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', margin: 0 }}>
            {success ? 'E-mail Enviado' : 'Esqueci Minha Senha'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            {success 
              ? 'Verifique sua caixa de entrada com as instruções para cadastrar uma nova senha.' 
              : 'Digite seu e-mail cadastrado para enviarmos as instruções de recuperação'
            }
          </p>
        </div>

        {success ? (
          <button 
            onClick={() => navigate('/login')}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', fontWeight: 700 }}
          >
            Voltar para o Login
          </button>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Mail size={14} style={{ color: 'var(--primary)' }} />
                E-mail Cadastrado
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

            {error && (
              <p style={{ color: 'var(--danger)', fontSize: '0.85rem', margin: 0, textAlign: 'center' }}>
                {error}
              </p>
            )}

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', fontWeight: 700 }}
              disabled={loading}
            >
              {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
