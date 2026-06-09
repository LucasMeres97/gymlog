// Service Worker do GymLog
// Versão: mude esse número sempre que atualizar o app
const CACHE_NAME = 'gymlog-v1';

// Arquivos que serão salvos para funcionar offline
const FILES_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
];

// Instalação: salva tudo no cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('GymLog: salvando arquivos offline...');
      // Tenta salvar cada arquivo, ignora erros de fontes/CDN
      return Promise.allSettled(
        FILES_TO_CACHE.map(url => cache.add(url).catch(e => console.warn('Não cacheou:', url)))
      );
    })
  );
  // Ativa imediatamente sem esperar fechar a aba
  self.skipWaiting();
});

// Ativação: remove caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('GymLog: removendo cache antigo:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Intercepta requisições: usa cache primeiro, depois rede
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse; // Retorna do cache (funciona offline)
      }
      // Não está no cache: busca na rede e salva para próxima vez
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Sem internet e sem cache: retorna o index.html como fallback
        return caches.match('./index.html');
      });
    })
  );
});
