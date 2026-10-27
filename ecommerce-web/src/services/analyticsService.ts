import api from './api';

const VISITOR_STORAGE_KEY = '3dprintpng_visitor_id';

let lastTrackedKey = '';
let lastTrackedTime = 0;

export function getOrCreateVisitorId(): string {
  try {
    let visitorId = localStorage.getItem(VISITOR_STORAGE_KEY);
    if (!visitorId) {
      const randomPart = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      visitorId = `vis_${randomPart}`;
      localStorage.setItem(VISITOR_STORAGE_KEY, visitorId);
    }
    return visitorId;
  } catch {
    return 'vis_anonymous';
  }
}

export async function trackSiteEvent(params: {
  eventType: 'PAGE_VIEW' | 'PRODUCT_VIEW' | 'ADD_TO_CART';
  pagePath?: string;
  productId?: string;
  productName?: string;
}): Promise<void> {
  try {
    const pagePath = params.pagePath || window.location.pathname;
    if (pagePath.startsWith('/admin')) {
      return;
    }

    const dedupeKey = `${params.eventType}:${pagePath}:${params.productId || ''}`;
    const now = Date.now();
    // Evita disparos duplicados em menos de 1.5s (ex: React StrictMode)
    if (dedupeKey === lastTrackedKey && now - lastTrackedTime < 1500) {
      return;
    }
    lastTrackedKey = dedupeKey;
    lastTrackedTime = now;

    await api.post('/api/analytics/track', {
      visitorId: getOrCreateVisitorId(),
      eventType: params.eventType,
      pagePath,
      productId: params.productId || null,
      productName: params.productName || null,
      referrer: document.referrer || null
    });
  } catch {
    // Falha silenciosa para nunca impactar a experiência do cliente na loja
  }
}
