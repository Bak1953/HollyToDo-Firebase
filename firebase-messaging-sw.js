'use strict';

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');
importScripts('./firebase-config.js');

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    const notificationTitle = payload.notification.title || "Holly's ToDo";
    const notificationOptions = {
        body: payload.notification.body || 'A task is coming due.',
        icon: './icon-192.png',
        badge: './icon-192.png'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
