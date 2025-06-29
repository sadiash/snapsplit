const CACHE_NAME = 'snapsplit-v1';
const STATIC_ASSETS = [
  '/',
  '/snap',
  '/split',
  '/share',
  '/history',
  '/settings',
  '/manifest.json',
  '/logo.svg',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Network first for API calls
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // If request fails, try to queue it for later
          if (!response.ok && event.request.method === 'POST') {
            return queueFailedRequest(event.request).then(() => {
              return new Response(JSON.stringify({ error: 'Working offline' }), {
                status: 503,
                headers: { 'Content-Type': 'application/json' },
              });
            });
          }
          return response;
        })
        .catch(() => {
          if (event.request.method === 'POST') {
            return queueFailedRequest(event.request).then(() => {
              return new Response(JSON.stringify({ error: 'Working offline' }), {
                status: 503,
                headers: { 'Content-Type': 'application/json' },
              });
            });
          }
          return new Response('Offline', { status: 503 });
        })
    );
    return;
  }

  // Cache first for static assets
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request).then((response) => {
        // Cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      });
    })
  );
});

// Queue failed requests for retry when online
function queueFailedRequest(request) {
  return new Promise((resolve) => {
    // Store failed request in IndexedDB or localStorage
    const failedRequests = JSON.parse(localStorage.getItem('failedRequests') || '[]');
    
    request.clone().text().then((body) => {
      failedRequests.push({
        url: request.url,
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
        body: body,
        timestamp: Date.now(),
      });
      
      localStorage.setItem('failedRequests', JSON.stringify(failedRequests));
      resolve();
    });
  });
}

// Retry failed requests when online
self.addEventListener('online', () => {
  const failedRequests = JSON.parse(localStorage.getItem('failedRequests') || '[]');
  
  failedRequests.forEach((requestData) => {
    fetch(requestData.url, {
      method: requestData.method,
      headers: requestData.headers,
      body: requestData.body,
    }).then(() => {
      // Remove successful request from queue
      const updatedRequests = failedRequests.filter(req => req.timestamp !== requestData.timestamp);
      localStorage.setItem('failedRequests', JSON.stringify(updatedRequests));
    });
  });
});