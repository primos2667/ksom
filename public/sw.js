/* KSOM Service Worker v3 - Network-first, auto-update, no reinstall needed! */
const CACHE_NAME = 'ksom-v3-locked-name-fix';

self.addEventListener('install', (event) => {
  console.log('KSOM SW v3 installing - will auto-update');
  self.skipWaiting(); // New SW takes over immediately, no reinstall needed!
});

self.addEventListener('activate', (event) => {
  console.log('KSOM SW v3 activating - cleaning old caches');
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('Deleting old cache', key);
          return caches.delete(key);
        }
      })
    )).then(() => {
      return self.clients.claim(); // Take control immediately
    })
  );
});

// 🔒 Handle messages
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'VIBRATE') {
    console.log('Vibrate requested');
  }
});

// 🚀 Network-first strategy - always try network, fallback to cache
// This ensures new deploys show instantly, no reinstall!
self.addEventListener('fetch', (event) => {
  // Skip non-GET and API calls
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('/api/') || event.request.url.includes('/supabase')) return;

  // For HTML pages - ALWAYS network-first, no cache!
  if (event.request.destination === 'document' || event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Don't cache HTML, always fresh!
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((cached) => cached || fetch(event.request));
        })
    );
    return;
  }

  // For other assets - network first, cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses for offline fallback
        if (response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// ✅ PUSH - Works even when app closed! Badge on home screen!
self.addEventListener('push', (event) => {
  console.log('📩 Push received!', event);
  let data = { title: 'New product on KSOM! 🚀', body: 'Someone posted a new item', badge: 1, image: '/ksom-icon.png' };
  if (event.data) {
    try { data = event.data.json(); } catch { try { data.body = event.data.text(); } catch { } }
  }
  const options = {
    body: data.body || data.message || 'New product posted!',
    icon: data.image || '/ksom-icon.png',
    badge: '/ksom-icon.png',
    vibrate: [300, 100, 300, 100, 300],
    data: { url: '/', productId: data.productId },
    tag: 'ksom-new-product',
    renotify: true,
    requireInteraction: false,
    silent: false,
  };
  if ('setAppBadge' in self.navigator) {
    self.navigator.setAppBadge(data.badge || 1).catch(() => { });
  }
  event.waitUntil(self.registration.showNotification(data.title || 'New on KSOM!', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if ('clearAppBadge' in self.navigator) self.navigator.clearAppBadge().catch(() => { });
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});

self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('Push subscription changed');
});
