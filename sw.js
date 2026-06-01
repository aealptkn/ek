const CACHE_NAME = "screen-recorder-cache-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon-192.svg",
  "/icon-512.svg"
];

// Install Service Worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Caching static assets...");
      return cache.addAll(ASSETS).catch(err => console.warn("Failed to cache some assets:", err));
    })
  );
});

// Activate Service Worker
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("Clearing old cache...");
            return caches.delete(key);
          }
        })
      );
    })
  );
});

// Fetch Request Interception
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cache or fetch fresh, then cache fresh response
      return cachedResponse || fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          // Only cache http/https schemes
          if (event.request.url.startsWith('http')) {
            cache.put(event.request, responseToCache);
          }
        });
        
        return response;
      }).catch(() => {
        // Fallback for offline when asset not cached
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
