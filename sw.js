// ── SERVICE WORKER — CAP Candidatures ────────────────────────────────────────
const CACHE_NAME = 'cap-20260925-1543';
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

  // Le document HTML (la page elle-même) : toujours privilégier le réseau,
  // pour que chaque mise à jour d'index.html soit vue au prochain chargement.
  // Le cache ne sert que de filet de sécurité si le téléphone est hors ligne.
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(reponse => {
          const copie = reponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, copie));
          return reponse;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Le reste (assets statiques) : cache-first comme avant
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
    tag: data.tag || undefined,
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
