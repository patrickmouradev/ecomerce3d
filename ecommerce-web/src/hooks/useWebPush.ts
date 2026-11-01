import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function useWebPush() {
  const { user, token } = useAuth();
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supported =
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;

    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((sub) => {
          setIsSubscribed(!!sub);
        });
      });
    }
  }, []);

  const subscribeToPush = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Notificações Web Push não são suportadas neste navegador/dispositivo.');
      return false;
    }

    if (!user || !token) {
      setError('É necessário estar autenticado para ativar notificações.');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Solicita permissão explícita (gesto do usuário)
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== 'granted') {
        setError('Permissão para notificações não foi concedida.');
        setLoading(false);
        return false;
      }

      // 2. Busca chave pública VAPID do backend
      const response = await api.get('/push/public-key');
      const publicKey = response.data.publicKey;

      if (!publicKey) {
        throw new Error('Chave pública VAPID não retornada pelo servidor.');
      }

      // 3. Obtém Service Worker e registra a PushSubscription
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        const convertedKey = urlBase64ToUint8Array(publicKey);
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey as unknown as BufferSource
        });
      }

      // 4. Envia os dados de inscrição para persistência no PostgreSQL
      const subJson = subscription.toJSON();
      const payload = {
        endpoint: subJson.endpoint,
        p256dh: subJson.keys?.p256dh,
        auth: subJson.keys?.auth,
        userAgent: navigator.userAgent,
        deviceType: /iphone|ipad|ipod/i.test(navigator.userAgent)
          ? 'IOS'
          : /android/i.test(navigator.userAgent)
          ? 'ANDROID'
          : 'DESKTOP'
      };

      await api.post('/push/subscribe', payload);

      setIsSubscribed(true);
      setLoading(false);
      return true;
    } catch (err: any) {
      console.error('[WebPush] Erro ao cadastrar inscrição de push:', err);
      setError(err?.response?.data?.message || err?.message || 'Falha ao ativar notificações push.');
      setLoading(false);
      return false;
    }
  }, [isSupported, user, token]);

  const unsubscribeFromPush = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const subJson = subscription.toJSON();
        if (subJson.endpoint) {
          try {
            await api.post('/push/unsubscribe', { endpoint: subJson.endpoint });
          } catch (e) {
            console.warn('[WebPush] Falha ao desinscrever no backend:', e);
          }
        }
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
      setLoading(false);
      return true;
    } catch (err: any) {
      console.error('[WebPush] Erro ao cancelar inscrição:', err);
      setError('Falha ao desativar notificações.');
      setLoading(false);
      return false;
    }
  }, [isSupported]);

  return {
    isSupported,
    permission,
    isSubscribed,
    loading,
    error,
    subscribeToPush,
    unsubscribeFromPush
  };
}
