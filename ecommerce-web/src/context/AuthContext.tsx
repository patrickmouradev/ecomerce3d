import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import api, { clearStoredAuthSession, getJwtExpirationMs } from '../services/api';

interface User {
  name: string;
  email: string;
}

interface AuthSessionPayload {
  token: string;
  name: string;
  email: string;
  activeRole: string;
  roles: string[];
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
  refreshSession: () => Promise<boolean>;
}

// Quando faltar 10 minutos (600s) ou menos para vencer os 3600s e houver atividade recente, renova o token
const RENEW_THRESHOLD_MS = 600 * 1000;
// Janela considerada como atividade recente do usuário (15 minutos)
const RECENT_ACTIVITY_WINDOW_MS = 15 * 60 * 1000;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const lastActivityRef = useRef<number>(Date.now());
  const isRenewingRef = useRef<boolean>(false);

  const applySession = useCallback((data: AuthSessionPayload) => {
    const cleanUser: User = { name: data.name, email: data.email };
    localStorage.setItem('3dprintpng_token', data.token);
    localStorage.setItem('3dprintpng_user', JSON.stringify(cleanUser));
    localStorage.setItem('3dprintpng_active_role', data.activeRole);
    localStorage.setItem('3dprintpng_roles', JSON.stringify(data.roles || []));

    setToken(data.token);
    setUser(cleanUser);
    setActiveRole(data.activeRole);
    setRoles(data.roles || []);
  }, []);

  const logout = useCallback(() => {
    clearStoredAuthSession();
    setToken(null);
    setUser(null);
    setActiveRole(null);
    setRoles([]);
  }, []);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    const currentToken = localStorage.getItem('3dprintpng_token');
    if (!currentToken) {
      logout();
      return false;
    }

    const expMs = getJwtExpirationMs(currentToken);
    if (expMs !== null && Date.now() >= expMs) {
      logout();
      return false;
    }

    if (isRenewingRef.current) {
      return true;
    }

    isRenewingRef.current = true;
    try {
      const response = await api.get('/api/auth/me');
      if (response.data && response.data.token) {
        applySession(response.data);
        return true;
      }
      logout();
      return false;
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        logout();
        return false;
      }
      return false;
    } finally {
      isRenewingRef.current = false;
    }
  }, [applySession, logout]);

  // 1. Carga inicial: valida se o token existe, não expirou e sincroniza com /api/auth/me
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      const savedToken = localStorage.getItem('3dprintpng_token');
      const savedUser = localStorage.getItem('3dprintpng_user');
      const savedActiveRole = localStorage.getItem('3dprintpng_active_role');
      const savedRoles = localStorage.getItem('3dprintpng_roles');

      if (!savedToken || !savedUser || !savedActiveRole || !savedRoles) {
        clearStoredAuthSession();
        if (mounted) setLoading(false);
        return;
      }

      const expMs = getJwtExpirationMs(savedToken);
      if (expMs !== null && Date.now() >= expMs) {
        clearStoredAuthSession();
        if (mounted) setLoading(false);
        return;
      }

      try {
        const parsedUser = JSON.parse(savedUser);
        const parsedRoles = JSON.parse(savedRoles);
        if (mounted) {
          setToken(savedToken);
          setUser(parsedUser);
          setActiveRole(savedActiveRole);
          setRoles(parsedRoles);
        }
      } catch {
        clearStoredAuthSession();
        if (mounted) setLoading(false);
        return;
      }

      // Valida no servidor e renova o token para garantir dados frescos
      await refreshSession();
      if (mounted) {
        setLoading(false);
      }
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, [refreshSession]);

  // 2. Escuta eventos globais de logout (disparados pelo interceptor da API) e de atividade
  useEffect(() => {
    const handleGlobalLogout = () => {
      logout();
    };

    const recordActivity = () => {
      lastActivityRef.current = Date.now();
    };

    window.addEventListener('auth:logout', handleGlobalLogout);
    window.addEventListener('auth:activity', recordActivity);
    window.addEventListener('mousedown', recordActivity, { passive: true });
    window.addEventListener('keydown', recordActivity, { passive: true });
    window.addEventListener('touchstart', recordActivity, { passive: true });
    window.addEventListener('scroll', recordActivity, { passive: true });

    // Também sincroniza entre abas se outra aba deslogar ou renovar o token
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === '3dprintpng_token') {
        if (!e.newValue) {
          logout();
        } else {
          const u = localStorage.getItem('3dprintpng_user');
          const r = localStorage.getItem('3dprintpng_active_role');
          const rs = localStorage.getItem('3dprintpng_roles');
          if (u && r && rs) {
            try {
              setToken(e.newValue);
              setUser(JSON.parse(u));
              setActiveRole(r);
              setRoles(JSON.parse(rs));
            } catch {
              logout();
            }
          }
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('auth:logout', handleGlobalLogout);
      window.removeEventListener('auth:activity', recordActivity);
      window.removeEventListener('mousedown', recordActivity);
      window.removeEventListener('keydown', recordActivity);
      window.removeEventListener('touchstart', recordActivity);
      window.removeEventListener('scroll', recordActivity);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [logout]);

  // 3. Verificador periódico de expiração (3600s) e renovação automática por atividade (Sliding Session)
  useEffect(() => {
    if (!token) return;

    const checkTokenLifecycle = () => {
      const currentToken = localStorage.getItem('3dprintpng_token');
      if (!currentToken) {
        logout();
        return;
      }

      const expMs = getJwtExpirationMs(currentToken);
      if (expMs === null) return;

      const now = Date.now();
      const remainingMs = expMs - now;

      if (remainingMs <= 0) {
        // Expirou sem renovação (usuário ficou inativo além dos 3600s)
        logout();
        return;
      }

      const hadRecentActivity = now - lastActivityRef.current <= RECENT_ACTIVITY_WINDOW_MS;
      if (remainingMs <= RENEW_THRESHOLD_MS && hadRecentActivity) {
        refreshSession();
      }
    };

    const interval = setInterval(checkTokenLifecycle, 20000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        lastActivityRef.current = Date.now();
        checkTokenLifecycle();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [token, logout, refreshSession]);

  const loginLocal = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await api.post('/api/auth/login', { email, password });
      lastActivityRef.current = Date.now();
      applySession(response.data);
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
      lastActivityRef.current = Date.now();
      applySession(response.data);
    } catch (error) {
      logout();
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const switchProfile = async (role: string) => {
    setLoading(true);
    try {
      const response = await api.post('/api/auth/switch-profile', { activeRole: role });
      lastActivityRef.current = Date.now();
      applySession(response.data);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfileDetails = async (newName: string) => {
    if (!user) return;
    const updatedUser = { ...user, name: newName };
    localStorage.setItem('3dprintpng_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        activeRole,
        roles,
        loading,
        loginLocal,
        registerLocal,
        logout,
        switchProfile,
        updateProfileDetails,
        refreshSession
      }}
    >
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
