import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface AdminGuardProps {
  children: React.ReactNode;
}

export const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  const { activeRole, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p style={{ color: 'var(--primary)', fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>
          Verificando autorização...
        </p>
      </div>
    );
  }

  // Permite acesso somente se o perfil ativo for ADMINISTRADOR ou FINANCEIRO
  if (activeRole !== 'ADMINISTRADOR' && activeRole !== 'FINANCEIRO') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
export default AdminGuard;
