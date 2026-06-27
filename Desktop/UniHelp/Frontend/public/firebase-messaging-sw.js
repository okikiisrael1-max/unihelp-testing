importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDEMRFDhpvIU9--ZJ8SDXsFV0R6KkKKrLY",
  authDomain: "campusflow-c415d.firebaseapp.com",
  projectId: "campusflow-c415d",
  storageBucket: "campusflow-c415d.firebasestorage.app",
  messagingSenderId: "304872852414",
  appId: "1:304872852414:web:8d9736ead9d011003507ef",
  measurementId: "G-EGC0NCXY5W",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title =
    payload?.notification?.title ||
    payload?.data?.title ||
    "UniHelp";

  const body =
    payload?.notification?.body ||
    payload?.data?.body ||
    payload?.data?.message ||
    "";

  const url = payload?.data?.url || "/announcements";

  self.registration.showNotification(title, {
    body,
    icon: "/favicon.png",
    data: { url },
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification?.data?.url || "/announcements";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(url);
      }

      return undefined;
    })
  );
});
