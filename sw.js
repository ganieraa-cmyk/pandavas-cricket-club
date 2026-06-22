const CACHE_NAME = 'pandavas-v3.1.0';
const urlsToCache = [
  '/', 'index.html', 'manifest.json',
  'src/app.js', '/src/firebase-config.js', '/src/styles/main.css',
  'src/pages/dashboard.js', '/src/pages/teams.js', '/src/pages/players.js',
  'src/pages/live-scoring.js', '/src/pages/tournament.js', '/src/pages/match-center.js',
  'src/pages/scorecard.js', '/src/pages/statistics.js', '/src/pages/leaderboards.js',
  'src/pages/match-report.js', '/src/pages/team-detail.js',
  'src/components/header.js', '/src/components/sidebar.js', '/src/components/modal.js',
  'src/components/playing-xi.js', '/src/components/charts.js',
  'src/utils/cricket.js', '/src/utils/undo-manager.js', '/src/utils/match-result.js',
  'src/utils/tournament-utils.js', '/src/utils/nrr-calculator.js',
  'src/utils/realtime-sync.js', '/src/utils/backup.js', '/src/utils/share.js',
  'src/utils/firestore-helpers.js', '/src/utils/pdf-generator.js',
  'icons/icon-192.png', '/icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(keyList.map(key => {
        if (key !== CACHE_NAME) {
          console.log('[SW] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) return response;
        return fetch(event.request).then(response => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            if (!event.request.url.includes('firebase') && 
                !event.request.url.includes('googleapis') &&
                !event.request.url.includes('gstatic')) {
              cache.put(event.request, responseToCache);
            }
          });
          return response;
        });
      })
      .catch(() => {
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match('/index.html');
        }
        return new Response('Offline - Please check your connection', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      })
  );
});
