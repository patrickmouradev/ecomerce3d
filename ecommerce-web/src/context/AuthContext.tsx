import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

interface User {
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  activeRole: string | null;
  roles: string[];
  loading: boolean;
  loginLocal: (email: string, password: string) => Promise<void>;
  registerLocal: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  switchProfile: (role: string) => Promise<void>;
  updateProfileDetails: (name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Tenta restabelecer sessão ativa na carga inicial
    const savedToken = localStorage.getItem('3dprintpng_token');
    const savedUser = localStorage.getItem('3dprintpng_user');
    const savedActiveRole = localStorage.getItem('3dprintpng_active_role');
    const savedRoles = localStorage.getItem('3dprintpng_roles');

    if (savedToken && savedUser && savedActiveRole && savedRoles) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      setActiveRole(savedActiveRole);
      setRoles(JSON.parse(savedRoles));
    }
    setLoading(false);
  }, []);

  const loginLocal = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { token, name, email: userEmail, activeRole, roles } = response.data;

      localStorage.setItem('3dprintpng_token', token);
      localStorage.setItem('3dprintpng_user', JSON.stringify({ name, email: userEmail }));
      localStorage.setItem('3dprintpng_active_role', activeRole);
      localStorage.setItem('3dprintpng_roles', JSON.stringify(roles));

      setToken(token);
      setUser({ name, email: userEmail });
      setActiveRole(activeRole);
      setRoles(roles);
    } catch (error) {
      logout();
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const registerLocal = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const response = await api.post('/api/auth/register', { name, email, password });
      const { token, name: userName, email: userEmail, activeRole, roles } = response.data;

      localStorage.setItem('3dprintpng_token', token);
      localStorage.setItem('3dprintpng_user', JSON.stringify({ name: userName, email: userEmail }));
      localStorage.setItem('3dprintpng_active_role', activeRole);
      localStorage.setItem('3dprintpng_roles', JSON.stringify(roles));

      setToken(token);
      setUser({ name: userName, email: userEmail });
      setActiveRole(activeRole);
      setRoles(roles);
    } catch (error) {
      logout();
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('3dprintpng_token');
    localStorage.removeItem('3dprintpng_user');
    localStorage.removeItem('3dprintpng_active_role');
    localStorage.removeItem('3dprintpng_roles');
    
    setToken(null);
    setUser(null);
    setActiveRole(null);
    setRoles([]);
  };

  const switchProfile = async (role: string) => {
    setLoading(true);
    try {
      const response = await api.post('/api/auth/switch-profile', { activeRole: role });
      const { token, name, email, activeRole, roles } = response.data;

      localStorage.setItem('3dprintpng_token', token);
      localStorage.setItem('3dprintpng_user', JSON.stringify({ name, email }));
      localStorage.setItem('3dprintpng_active_role', activeRole);
      localStorage.setItem('3dprintpng_roles', JSON.stringify(roles));

      setToken(token);
      setUser({ name, email });
      setActiveRole(activeRole);
      setRoles(roles);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfileDetails = async (newName: string) => {
    if (!user) return;
    try {
      // Simulação ou chamada real de atualização cadastral
      const updatedUser = { ...user, name: newName };
      localStorage.setItem('3dprintpng_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      activeRole,
      roles,
      loading,
      loginLocal,
      registerLocal,
      logout,
      switchProfile,
      updateProfileDetails
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
