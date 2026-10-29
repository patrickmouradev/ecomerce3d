import axios from 'axios';

export function getJwtExpirationMs(token: string | null): number | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const payload = JSON.parse(atob(padded));
    if (typeof payload.exp === 'number') {
      return payload.exp * 1000;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearStoredAuthSession(): void {
  localStorage.removeItem('3dprintpng_token');
  localStorage.removeItem('3dprintpng_user');
  localStorage.removeItem('3dprintpng_active_role');
  localStorage.removeItem('3dprintpng_roles');
}

const api = axios.create({
  baseURL: '', // Utiliza o proxy configurado no Vite em desenvolvimento
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0'
  }
});

// Interceptor para injetar o token JWT em cada requisição e evitar cache
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('3dprintpng_token');
    if (token) {
      const expMs = getJwtExpirationMs(token);
      if (expMs !== null && Date.now() >= expMs) {
        clearStoredAuthSession();
        window.dispatchEvent(new Event('auth:logout'));
      } else {
        config.headers.Authorization = `Bearer ${token}`;
        window.dispatchEvent(new Event('auth:activity'));
      }
    }

    // Garante cabeçalhos anti-cache em todas as chamadas
    config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    config.headers['Pragma'] = 'no-cache';
    config.headers['Expires'] = '0';

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratamento global de erros (ex: 401 desloga e sincroniza React)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const token = localStorage.getItem('3dprintpng_token');
    const expMs = getJwtExpirationMs(token);
    const isTokenExpired = expMs !== null && Date.now() >= expMs;

    if (status === 401 || (status === 403 && isTokenExpired)) {
      clearStoredAuthSession();
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(error);
  }
);

export default api;
