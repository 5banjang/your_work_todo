const CACHE_NAME = "your-todo-v3";
const STATIC_ASSETS = ["/", "/manifest.json"];

// Install: cache shell files
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
    );
    self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Fetch: network-first with cache fallback
self.addEventListener("fetch", (event) => {
    // Skip non-GET and chrome-extension requests
    if (event.request.method !== "GET") return;
    if (event.request.url.startsWith("chrome-extension://")) return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Clone and cache successful same-origin responses
                if (response.status === 200 && event.request.url.startsWith(self.location.origin)) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            })
            .catch(() => {
                // Fallback to cache when offline
                return caches.match(event.request).then((cached) => {
                    if (cached) return cached;
                    // For navigation requests, serve the cached index
                    if (event.request.mode === "navigate") {
                        return caches.match("/");
                    }
                    return new Response("오프라인 상태입니다", { status: 503 });
                });
            })
    );
});

// Push notifications (for FCM & future geofence alerts)
self.addEventListener("push", (event) => {
    let data = {};
    try {
        data = event.data ? event.data.json() : {};
    } catch (e) {
        console.error("Push data parsing failed", e);
    }

    // Support both direct data payloads and FCM notification object
    const title = data.notification?.title || data.title || "Your To-Do";
    const body = data.notification?.body || data.body || "새로운 알림이 있습니다";

    const options = {
        body: body,
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        vibrate: [200, 100, 200, 100, 200], // Stronger vibration pattern
        data: { url: data.data?.url || data.url || "/" },
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click
self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const url = event.notification.data?.url || "/";
    event.waitUntil(
        self.clients.matchAll({ type: "window" }).then((clients) => {
            for (const client of clients) {
                if (client.url === url && "focus" in client) return client.focus();
            }
            if (self.clients.openWindow) {
                return self.clients.openWindow(url);
            }
        })
    );
});

// Message handler: allow the app to tell running SW to skip waiting
self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "SKIP_WAITING") {
        self.skipWaiting();
    }
});
