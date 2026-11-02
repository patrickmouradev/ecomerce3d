// Service Worker para 3DPrintPNG PWA e Notificações Push (Web Push)
const CACHE_NAME = '3dprintpng-v1';

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  // Força ativação imediata sem esperar fechamento das abas antigas
  self.skipWaiting();
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Manipulador do evento 'push' (Recepção de notificações em background)
self.addEventListener('push', (event) => {
  let data = {};
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = {
        title: '3DPrintPNG',
        body: event.data.text()
      };
    }
  }

  const title = data.title || '3DPrintPNG';
  const options = {
    body: data.body || 'Você tem uma nova atualização na 3DPrintPNG!',
    icon: data.icon || '/pwa-192x192.png',
    badge: data.badge || '/favicon.png',
    vibrate: [150, 50, 150],
    data: {
      url: data.url || '/'
    },
    tag: data.tag || '3dprintpng-notification',
    renotify: true
  };

  // No iOS (WebKit) e Android, é obrigatório chamar showNotification no waitUntil
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Manipulador do clique na notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const targetUrl = event.notification.data && event.notification.data.url
    ? event.notification.data.url
    : '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Se já houver uma aba aberta no mesmo domínio, foca nela e navega
      for (const client of clientList) {
        if ('focus' in client) {
          if (client.url.includes(self.location.origin)) {
            client.focus();
            if ('navigate' in client) {
              return client.navigate(targetUrl);
            }
            return;
          }
        }
      }
      // Se não houver aba aberta, abre uma nova janela
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
