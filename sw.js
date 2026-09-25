// ── SERVICE WORKER — CAP Candidatures ────────────────────────────────────────
// Cache minimal : assets statiques seulement
const CACHE_NAME = 'cap-20260925-1522';
const ASSETS = ['./'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Ne pas intercepter les appels API (Apps Script)
  if (e.request.url.includes('script.google.com') ||
      e.request.url.includes('googleapis.com')) {
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

// ── NOTIFICATIONS PUSH ────────────────────────────────────────────────────────
self.addEventListener('push', e => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch (err) { data = { titre: 'Candidatures', corps: e.data ? e.data.text() : '' }; }

  const titre = data.titre || 'Candidatures';
  const options = {
    body: data.corps || '',
    icon: 'icon-152.png',
    badge: 'icon-152.png',
    data: { url: data.url || './' },
    tag: data.tag || undefined, // regroupe les notifs similaires au lieu d'empiler
  };

  e.waitUntil(self.registration.showNotification(titre, options));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientsArr => {
      const existant = clientsArr.find(c => c.url.includes(self.location.origin));
      if (existant) return existant.focus();
      return self.clients.openWindow(url);
    })
  );
});
