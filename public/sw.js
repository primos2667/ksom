/* KSOM Service Worker - Handles Push + Badge on Home Screen even when app closed! */
const CACHE_NAME = 'ksom-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Handle vibration message from main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'VIBRATE') {
    // Try to vibrate from SW (some browsers allow)
    console.log('Vibrate requested from SW');
  }
});

// ✅ PUSH EVENT - This runs even when app is CLOSED! This is for background badge!
self.addEventListener('push', (event) => {
  console.log('📩 Push received!', event);
  let data = { title: 'New product on KSOM! 🚀', body: 'Someone posted a new item', badge: 1, image: '/ksom-icon.png' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      try {
        data.body = event.data.text();
      } catch { }
    }
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

  // ✅ SET BADGE ON APP ICON - This shows 1 on home screen app icon! Works when app closed!
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

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('Push subscription changed');
});
