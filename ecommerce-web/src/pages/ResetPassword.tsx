import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { Lock, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Token de redefinição inválido ou ausente.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (password.length < 6) {
      setError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      await api.post(`/api/auth/reset-password?token=${encodeURIComponent(token)}&newPassword=${encodeURIComponent(password)}`);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Falha ao redefinir a senha');
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
            {success ? 'Senha Redefinida' : 'Nova Senha'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            {success 
              ? 'Sua senha foi redefinida com sucesso. Agora você pode entrar com sua nova senha.' 
              : 'Cadastre a sua nova senha de acesso'
            }
          </p>
        </div>

        {success ? (
          <button 
            onClick={() => navigate('/login')}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', fontWeight: 700 }}
          >
            Fazer Login
          </button>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Lock size={14} style={{ color: 'var(--primary)' }} />
                Nova Senha
              </label>
              <input 
                type="password" 
                placeholder="Mínimo 6 caracteres" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                required
                minLength={6}
                disabled={loading}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Lock size={14} style={{ color: 'var(--primary)' }} />
                Confirmar Nova Senha
              </label>
              <input 
                type="password" 
                placeholder="Confirme sua nova senha" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="form-input"
                required
                minLength={6}
                disabled={loading}
              />
            </div>

            {error && (
              <p style={{ color: 'var(--danger)', fontSize: '0.85rem', margin: 0, textAlign: 'center' }}>
                {error}
              </p>
            )}

            {!token && (
              <p style={{ color: 'var(--danger)', fontSize: '0.85rem', margin: 0, textAlign: 'center' }}>
                Aviso: Nenhum token de redefinição foi encontrado na URL da página.
              </p>
            )}

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', fontWeight: 700 }}
              disabled={loading || !token}
            >
              {loading ? 'Redefinindo...' : 'Alterar Senha'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
