// Service Worker para Cuaderno Digital POS v2.0
// Estrategia: Cache First para estáticos, Network First para API

const CACHE_NAME = 'cuaderno-digital-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/placeholder.svg'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Assets estáticos cacheados');
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error('[SW] Error al cachear assets:', err);
      })
  );
});

// Activación - Limpieza de cachés antiguas
self.addEventListener('activate', (event) => {
  console.log('[SW] Activando Service Worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Eliminando caché antigua:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('[SW] Service Worker activado');
      return self.clients.claim();
    })
  );
});

// Estrategia de fetch
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // No interceptar requests de Supabase ni API externas
  if (url.hostname.includes('supabase') || 
      url.hostname.includes('googleapis') ||
      request.method !== 'GET') {
    return;
  }

  // Estrategia Cache First para assets estáticos
  if (STATIC_ASSETS.some(asset => url.pathname === asset || url.pathname.startsWith('/assets/'))) {
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) {
          return response;
        }
        return fetch(request).then((fetchResponse) => {
          if (fetchResponse && fetchResponse.status === 200) {
            const responseClone = fetchResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return fetchResponse;
        });
      }).catch(() => {
        // Fallback si no hay caché ni red
        return new Response('Offline - Cuaderno Digital', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' }
        });
      })
    );
    return;
  }

  // Network First para otras rutas
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request);
    })
  );
});

// Manejo de notificaciones push (para futuras notificaciones de pago)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title || 'Cuaderno Digital', {
        body: data.body || 'Notificación del sistema',
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: data.tag || 'default',
        requireInteraction: data.requireInteraction || false
      })
    );
  }
});

// Manejo de clic en notificación
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
