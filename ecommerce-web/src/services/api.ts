import axios from 'axios';

const api = axios.create({
  baseURL: '', // Utiliza o proxy configurado no Vite em desenvolvimento
});

// Interceptor para injetar o token JWT em cada requisição
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('3dprintpng_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor para tratamento global de erros (ex: 401 desloga)
api.interceptors.response.use((response) => {
  return response;
}, (error) => {
  if (error.response && error.response.status === 401) {
    // Limpa sessão em caso de expiração de token
    localStorage.removeItem('3dprintpng_token');
    localStorage.removeItem('3dprintpng_user');
    if (!window.location.pathname.startsWith('/login') && window.location.pathname !== '/') {
      window.location.href = '/';
    }
  }
  return Promise.reject(error);
});

export default api;
