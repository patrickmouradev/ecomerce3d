import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Recarrega automaticamente caso ocorra erro ao carregar chunks de uma nova versão pós-deploy
window.addEventListener('vite:preloadError', () => {
  window.location.reload();
});

// Registro do Service Worker PWA (HTTPS, Localhost, 127.0.0.1 ou Contexto Seguro)
if ('serviceWorker' in navigator && (window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('[PWA] Service Worker registrado com sucesso no escopo:', registration.scope);
      })
      .catch((error) => {
        console.warn('[PWA] Aviso ao registrar Service Worker:', error);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
