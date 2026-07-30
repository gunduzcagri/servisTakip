/// <reference lib="webworker" />

const CACHE_NAME = "servisnet-v1";
const OFFLINE_URL = "/offline.html";

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  OFFLINE_URL,
];

// Install: cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// Fetch: network first, fallback to cache
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // API requests: network first, then cache
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful GET requests
          if (request.method === "GET" && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        })
        .catch(() => {
          // Offline: try cache
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            
            // For POST/PUT/PATCH offline, return special response
            if (request.method !== "GET") {
              return new Response(
                JSON.stringify({ offline: true, queued: true }),
                {
                  status: 202,
                  headers: { "Content-Type": "application/json" },
                }
              );
            }
            
            // Fallback for GET
            return caches.match(OFFLINE_URL);
          });
        })
    );
    return;
  }

  // Static assets: cache first
  event.respondWith(
    caches.match(request).then((cached) => {
      return cached || fetch(request);
    })
  );
});

// Sync: handle background sync for offline actions
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-offline-actions") {
    event.waitUntil(syncOfflineActions());
  }
});

async function syncOfflineActions() {
  try {
    const offlineData = localStorage.getItem("offlineQueue");
    if (!offlineData) return;

    const queue = JSON.parse(offlineData);
    if (!queue.length) return;

    const synced: any[] = [];

    for (const item of queue) {
      try {
        await fetch(item.url, {
          method: item.method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item.body),
        });
        synced.push(item.id);
      } catch (err) {
        console.log("Sync failed for item:", item.id);
      }
    }

    // Remove synced items
    const remaining = queue.filter((i: any) => !synced.includes(i.id));
    localStorage.setItem("offlineQueue", JSON.stringify(remaining));

    // Notify clients
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: "SYNC_COMPLETE",
          synced: synced.length,
          remaining: remaining.length,
        });
      });
    });
  } catch (err) {
    console.error("Sync error:", err);
  }
}
