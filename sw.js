// Service Worker — Canteiro Pessoal
const CACHE = 'canteiro-v8';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Só intercepta requisições http/https — ignora chrome-extension e outros schemes
  if (!url.startsWith('http')) return;

  // Nunca cacheia index.html nem Apps Script — sempre busca versão nova
  if (
    url.includes('script.google.com') ||
    url.endsWith('/') ||
    url.includes('index.html')
  ) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        // Só cacheia respostas básicas válidas — evita clonar opaque/used responses
        if (!res || res.status !== 200 || res.type !== 'basic') return res;
        const resClone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, resClone));
        return res;
      }).catch(() => cached || new Response('Offline', { status: 503 }));
    })
  );
});
