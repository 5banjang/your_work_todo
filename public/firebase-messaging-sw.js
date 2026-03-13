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

// ★ data-only 메시지를 수신하여 Service Worker가 직접 알림을 생성합니다.
// 이렇게 하면 사운드, 진동 등을 완전히 제어할 수 있습니다.
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message', payload);

    const data = payload.data || {};
    const notificationTitle = data.title || 'Your To-Do';
    const notificationOptions = {
        body: data.body || '새로운 알림이 도착했습니다.',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        vibrate: [200, 100, 200, 100, 200],
        tag: data.todoId ? 'todo-' + data.todoId : 'todo-msg-' + Date.now(),
        requireInteraction: true,
        silent: false,
        data: {
            url: data.url || '/'
        }
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Click event for background notifications
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

// Service Worker push event handler (data-only 메시지의 경우 이 핸들러가 호출됨)
self.addEventListener('push', (event) => {
    if (event.data) {
        let payload;
        try {
            payload = event.data.json();
        } catch (e) {
            payload = { data: { title: 'Your To-Do', body: event.data.text() } };
        }

        // FCM SDK가 이미 onBackgroundMessage로 처리한 경우 중복 방지
        if (payload.notification) {
            // notification 키가 있으면 FCM SDK가 자동 처리하므로 여기서는 무시
            return;
        }

        const data = payload.data || {};
        const notificationTitle = data.title || 'Your To-Do';
        const notificationOptions = {
            body: data.body || '상태가 업데이트되었습니다.',
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-192.png',
            vibrate: [200, 100, 200, 100, 200],
            tag: data.todoId ? 'todo-' + data.todoId : 'todo-msg-' + Date.now(),
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
