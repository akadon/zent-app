const CACHE_VERSION = "zent-v2";
const STATIC_CACHE = CACHE_VERSION + "-static";
const API_CACHE = CACHE_VERSION + "-api";
const CDN_CACHE = CACHE_VERSION + "-cdn";

// Static assets to precache
const PRECACHE_URLS = ["/", "/manifest.json"];

// Install: precache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith("zent-") && !key.startsWith(CACHE_VERSION))
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: routing strategy
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET and WebSocket
  if (event.request.method !== "GET") return;
  if (url.pathname.startsWith("/gateway")) return;
  if (url.pathname.startsWith("/socket.io")) return;

  // CDN assets (avatars, attachments, icons, emojis) - Cache First
  if (
    url.pathname.startsWith("/avatars") ||
    url.pathname.startsWith("/attachments") ||
    url.pathname.startsWith("/icons") ||
    url.pathname.startsWith("/emojis") ||
    url.pathname.startsWith("/banners") ||
    url.pathname.startsWith("/stickers")
  ) {
    event.respondWith(cacheFirst(event.request, CDN_CACHE, 30 * 24 * 60 * 60));
    return;
  }

  // API data (guilds, channels, messages) - Network First with cache fallback
  if (url.pathname.startsWith("/api/")) {
    // Cache guild/channel/user data for offline access
    if (
      url.pathname.match(/\/api\/(guilds|channels|users)/) &&
      !url.pathname.includes("/typing")
    ) {
      event.respondWith(networkFirst(event.request, API_CACHE, 5 * 60));
      return;
    }
    // Don't cache auth, upload, or mutation endpoints
    return;
  }

  // Static assets (JS, CSS, images) - Stale While Revalidate
  if (
    url.pathname.startsWith("/_next/") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".woff2")
  ) {
    event.respondWith(staleWhileRevalidate(event.request, STATIC_CACHE));
    return;
  }

  // HTML pages - Network First
  if (event.request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(networkFirst(event.request, STATIC_CACHE, 60));
    return;
  }
});

// Cache First strategy
async function cacheFirst(request, cacheName, maxAge) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    return new Response("Offline", { status: 503 });
  }
}

// Network First strategy
async function networkFirst(request, cacheName, maxAge) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: "offline" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Stale While Revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
  const cached = await caches.match(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        caches.open(cacheName).then((cache) => cache.put(request, response.clone()));
      }
      return response;
    })
    .catch(() => cached);
  return cached || fetchPromise;
}

// Background sync for pending messages
self.addEventListener("sync", (event) => {
  if (event.tag === "send-pending-messages") {
    event.waitUntil(sendPendingMessages());
  }
});

async function sendPendingMessages() {
  try {
    const db = await new Promise((resolve, reject) => {
      const req = indexedDB.open("zent-outbox", 1);
      req.onupgradeneeded = () => req.result.createObjectStore("messages", { keyPath: "id", autoIncrement: true });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    const tx = db.transaction("messages", "readwrite");
    const store = tx.objectStore("messages");
    const all = await new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    for (const msg of all) {
      try {
        const res = await fetch(msg.url, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: msg.authorization },
          body: JSON.stringify(msg.body),
        });
        if (res.ok) {
          const delTx = db.transaction("messages", "readwrite");
          delTx.objectStore("messages").delete(msg.id);
        }
      } catch {
        // Will retry on next sync
      }
    }
    db.close();
  } catch {
    // IndexedDB not available or empty — nothing to send
  }
}

// Push notifications
self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || "Zent", {
      body: data.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: data.tag || "zent-notification",
      data: data.url ? { url: data.url } : undefined,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(self.clients.openWindow(url));
});