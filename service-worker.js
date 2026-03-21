const CACHE_NAME = 'financas-v1';
const ASSETS = [
  '/Financas/',
  '/Financas/index.html',
  '/Financas/manifest.json',
  'https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js'
];

// Instala e faz cache dos arquivos principais
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Limpa caches antigos ao ativar
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Estratégia: Network first, cache como fallback
self.addEventListener('fetch', event => {
  // Ignora requisições Firebase (sempre precisam de rede)
  if(event.request.url.includes('firebase') ||
     event.request.url.includes('firestore') ||
     event.request.url.includes('googleapis.com/identitytoolkit')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Salva cópia no cache se for uma requisição válida
        if(response && response.status === 200 && response.type !== 'opaque') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Se não tiver rede, usa o cache
        return caches.match(event.request)
          .then(cached => cached || caches.match('/Financas/index.html'));
      })
  );
});
