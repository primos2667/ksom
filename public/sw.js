/* KSOM Service Worker v6 - Final - Morning News Bait + My Shop + No Reinstall + No CACHE_NAME error */
const CACHE_NAME = 'ksom-v6-final-bait';

self.addEventListener('install', (event) => {
  console.log('KSOM SW v6 installing - morning news bait');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('KSOM SW v6 activating - cleaning old caches');
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('Deleting old cache', key);
          return caches.delete(key);
        }
      })
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'VIBRATE') {
    console.log('Vibrate requested from main app');
  }
});

// Network-first: always fresh, no reinstall needed!
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('/api/') || event.request.url.includes('supabase')) return;

  // HTML - ALWAYS network first, never cache!
  if (event.request.destination === 'document' || event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => response)
        .catch(() => caches.match(event.request).then((cached) => cached || fetch(event.request)))
    );
    return;
  }

  // Assets - network first, cache fallback for offline
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// PUSH - Works when app closed! Handles both product and morning news bait!
self.addEventListener('push', (event) => {
  console.log('📩 Push received!', event);
  let data = { title: '☀️ Your Morning News is ready!', body: 'Tap to read top news + see new items on KSOM!', badge: 1, image: '/ksom-icon.png', url: '/' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      try { data.body = event.data.text(); } catch { }
    }
  }

  const isMorningNews = data.title && (data.title.includes('☀️') || data.title.includes('Morning') || data.title.includes('News'));

  const options = {
    body: data.body || data.message || 'New on KSOM!',
    icon: data.image || '/ksom-icon.png',
    badge: '/ksom-icon.png',
    image: data.image, // Show news image in notification!
    vibrate: isMorningNews ? [200, 100, 200, 100, 400] : [300, 100, 300, 100, 300],
    data: { url: data.url || '/', productId: data.productId, newsId: data.newsId },
    tag: isMorningNews ? 'ksom-morning-news' : 'ksom-new-product',
    renotify: true,
    requireInteraction: false,
    silent: false,
  };

  if ('setAppBadge' in self.navigator) {
    self.navigator.setAppBadge(data.badge || 1).catch(() => { });
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'New on KSOM!', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if ('clearAppBadge' in self.navigator) {
    self.navigator.clearAppBadge().catch(() => { });
  }
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('Push subscription changed - will re-subscribe');
});
