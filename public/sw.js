const CACHE_NAME = "your-todo-v4";
const STATIC_ASSETS = ["/", "/manifest.json"];

// Firebase App & Messaging SDK Import
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyC28le0D8ZR34zUHucyFW2BD3VIWYFQxQc",
    authDomain: "your-to-do-10bd1.firebaseapp.com",
    projectId: "your-to-do-10bd1",
    storageBucket: "your-to-do-10bd1.firebasestorage.app",
    messagingSenderId: "1041400480661",
    appId: "1:1041400480661:web:94e79c883ad63b2c86ac9c",
    measurementId: "G-98RCYRFFEX"
});

const messaging = firebase.messaging();

// Install: cache shell files
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
    );
});

self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "SKIP_WAITING") {
        self.skipWaiting();
    }
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
    if (event.request.method !== "GET") return;
    if (event.request.url.startsWith("chrome-extension://")) return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                if (response.status === 200 && event.request.url.startsWith(self.location.origin)) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            })
            .catch(() => {
                return caches.match(event.request).then((cached) => {
                    if (cached) return cached;
                    if (event.request.mode === "navigate") {
                        return caches.match("/");
                    }
                    return new Response("오프라인 상태입니다", { status: 503 });
                });
            })
    );
});

// Notification click
self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    // Use URL from data, fallback to root
    const url = event.notification.data?.url || "/";

    event.waitUntil(
        self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
            // Check if there is already a window open with this origin
            for (const client of clients) {
                if (client.url.includes(self.location.origin) && "focus" in client) {
                    return client.focus().then(c => c.navigate(url));
                }
            }
            // If not, open a new window
            if (self.clients.openWindow) {
                return self.clients.openWindow(url);
            }
        })
    );
});

// data-only 메시지를 수신하여 Service Worker가 직접 알림을 생성합니다.
messaging.onBackgroundMessage((payload) => {
    console.log('[sw.js] Background message received', payload);

    const data = payload.data || {};
    const notificationTitle = data.title || 'Your To-Do';
    const notificationOptions = {
        body: data.body || '할 일 상태가 업데이트되었습니다.',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        vibrate: [200, 100, 200, 100, 200],
        tag: data.todoId ? 'todo-' + data.todoId : 'todo-msg-' + Date.now(),
        requireInteraction: true,
        data: {
            url: data.url || '/'
        }
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Push event fallback for data-only messages
self.addEventListener('push', (event) => {
    if (!event.data) return;

    let payload;
    try {
        payload = event.data.json();
    } catch (e) {
        payload = { data: { title: 'Your To-Do', body: event.data.text() } };
    }

    // FCM SDK handler will take care of notification key
    if (payload.notification) return;

    const data = payload.data || {};
    const notificationTitle = data.title || 'Your To-Do';
    const notificationOptions = {
        body: data.body || '할 일이 완료되었습니다.',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        vibrate: [200, 100, 200, 100, 200],
        tag: data.type === 'TODO_COMPLETED' ? 'todo-completion-' + Date.now() : 'todo-msg-' + Date.now(),
        requireInteraction: true,
        data: {
            url: data.url || '/'
        }
    };

    event.waitUntil(
        self.registration.showNotification(notificationTitle, notificationOptions)
    );
});
