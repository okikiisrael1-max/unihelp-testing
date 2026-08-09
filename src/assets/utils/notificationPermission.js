import { getToken, onMessage } from "firebase/messaging";

import { messaging } from "../../firebase/config";

const VAPID_KEY =
  import.meta.env.VITE_FIREBASE_VAPID_KEY || "";

const getServiceWorkerRegistration = async () => {
  if (!("serviceWorker" in navigator)) return null;

  const serviceWorkerUrl = new URL(
    "../../firebase/firebase-messaging-sw.js",
    import.meta.url
  );

  try {
    const existingRegistration = (
      await navigator.serviceWorker.getRegistrations()
    ).find(
      (registration) =>
        registration.active?.scriptURL === serviceWorkerUrl.href ||
        registration.installing?.scriptURL === serviceWorkerUrl.href ||
        registration.waiting?.scriptURL === serviceWorkerUrl.href
    );

    if (existingRegistration) {
      await navigator.serviceWorker.ready;
      return existingRegistration;
    }

    const registration = await navigator.serviceWorker.register(
      serviceWorkerUrl,
      { scope: "/", type: "module" }
    );

    await navigator.serviceWorker.ready;
    return registration;
  } catch (error) {
    console.log("Service worker registration failed:", error);
    return null;
  }
};

const showForegroundNotification = (payload = {}) => {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

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

  const notification = new Notification(title, {
    body,
    icon: "/favicon.png",
    data: { url },
  });

  notification.onclick = () => {
    window.focus();
    if (url) window.location.href = url;
    notification.close();
  };
};

export const requestNotificationPermission = async () => {
  try {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return null;
    }

    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      return null;
    }

    const serviceWorkerRegistration = await getServiceWorkerRegistration();

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: serviceWorkerRegistration || undefined,
    });

    return token || null;
  } catch (err) {
    console.log("FCM permission error:", err);
    return null;
  }
};

export const listenToForegroundMessages = () => {
  return onMessage(messaging, (payload) => {
    console.log("Foreground notification:", payload);
    showForegroundNotification(payload);
  });
};
