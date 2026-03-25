const CACHE_VERSION = 'food-journal-v9';
const CACHE = CACHE_VERSION;
const STATIC = [
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
  // External libraries – cached for offline use
  'https://cdn.jsdelivr.net/npm/preact@10/dist/preact.umd.js',
  'https://cdn.jsdelivr.net/npm/preact@10/hooks/dist/hooks.umd.js',
  'https://cdn.jsdelivr.net/npm/htm@3/dist/htm.umd.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(STATIC))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Always bypass cache for API calls and external data sources
  if (url.includes('api.anthropic.com') ||
      url.includes('gist.githubusercontent.com')) {
    return;
  }

  // Navigation requests (HTML): network first, fallback to cache
  if (e.request.mode === 'navigate' ||
      url.endsWith('/') ||
      url.includes('index.html')) {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' })
        .then(res => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => caches.match('index.html'))
    );
    return;
  }

  // All other requests (including cached static assets, images, libraries)
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        // Cache successful responses for future offline use
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => {
        // Ultimate fallback: show a simple offline message
        return new Response('Offline – content not available', { status: 503 });
      });
    })
  );
});
