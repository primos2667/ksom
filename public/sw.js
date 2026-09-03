/* KSOM Service Worker - Handles Push + Badge on Home Screen even when app closed! */
const CACHE_NAME = 'ksom-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// ✅ PUSH EVENT - This runs even when app is CLOSED!
self.addEventListener('push', (event) => {
  console.log('📩 Push received!', event);
  let data = { title: 'New product on KSOM!', body: 'Someone posted a new item', badge: 1, image: '/ksom-icon.png' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body || data.message || 'New product posted!',
    icon: data.image || '/ksom-icon.png',
    badge: '/ksom-icon.png',
    vibrate: [200, 100, 200],
    data: { url: '/', productId: data.productId },
    tag: 'ksom-new-product',
    renotify: true,
    requireInteraction: false,
  };

  // ✅ SET BADGE ON APP ICON - This shows 1 on home screen app icon!
  if ('setAppBadge' in self.navigator) {
    self.navigator.setAppBadge(data.badge || 1).catch(() => { });
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Clear badge when user clicks notification
  if ('clearAppBadge' in self.navigator) {
    self.navigator.clearAppBadge().catch(() => { });
  }

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // If KSOM already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Else open KSOM
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('Push subscription changed');
});
