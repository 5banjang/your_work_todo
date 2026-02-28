importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// v3.5.4 — Force SW update
const SW_VERSION = '3.5.4';

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

// ★ Background message handler — FCM data-only 메시지 처리
messaging.onBackgroundMessage((payload) => {
    console.log('[FCM SW v' + SW_VERSION + '] Background message received:', JSON.stringify(payload));

    const data = payload.data || {};
    const notificationTitle = data.title || 'Your To-Do 알림';
    const notificationBody = data.body || '새로운 알림이 있습니다.';

    const notificationOptions = {
        body: notificationBody,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        vibrate: [200, 100, 200, 100, 200],
        tag: (data.type || 'general') + '-' + (data.todoId || Date.now()),
        requireInteraction: true,
        silent: false,
        data: {
            url: data.url || '/'
        }
    };

    console.log('[FCM SW] Showing notification:', notificationTitle, notificationBody);
    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Click event for notifications
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = event.notification.data?.url || '/';

    event.waitUntil(
        self.clients.matchAll({ type: 'window' }).then((clients) => {
            for (const client of clients) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus();
                }
            }
            if (self.clients.openWindow) {
                return self.clients.openWindow(url);
            }
        })
    );
});

// Push event handler — fallback for direct push (not via FCM SDK)
self.addEventListener('push', (event) => {
    if (event.data) {
        let payload;
        try {
            payload = event.data.json();
        } catch (e) {
            payload = { data: { title: 'Your To-Do', body: event.data.text() } };
        }

        console.log('[FCM SW v' + SW_VERSION + '] Push event:', JSON.stringify(payload));

        // If FCM SDK already handled via onBackgroundMessage, skip
        if (payload.notification) {
            return;
        }

        const data = payload.data || {};
        const notificationTitle = data.title || '할 일 알림';
        const notificationBody = data.body || '할 일 상태가 변경되었습니다.';

        const notificationOptions = {
            body: notificationBody,
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-192.png',
            vibrate: [200, 100, 200, 100, 200],
            tag: (data.type || 'push') + '-' + (data.todoId || Date.now()),
            requireInteraction: true,
            silent: false,
            data: {
                url: data.url || '/'
            }
        };

        event.waitUntil(
            self.registration.showNotification(notificationTitle, notificationOptions)
        );
    }
});
