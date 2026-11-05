import { getToken, onMessage } from "firebase/messaging";
import firebaseMessagingWorkerUrl from "../../firebase/firebase-messaging-sw.js?worker&url";

import { messaging } from "../../firebase/config";

const VAPID_KEY =
  import.meta.env.VITE_FIREBASE_VAPID_KEY || "";

const waitForActiveWorker = (registration) => {
  if (registration.active) return Promise.resolve(registration);

  const worker = registration.installing || registration.waiting;
  if (!worker) return Promise.reject(new Error("Firebase messaging worker is not active."));

  return new Promise((resolve, reject) => {
    const handleStateChange = () => {
      if (worker.state === "activated") {
        worker.removeEventListener("statechange", handleStateChange);
        resolve(registration);
      } else if (worker.state === "redundant") {
        worker.removeEventListener("statechange", handleStateChange);
        reject(new Error("Firebase messaging worker failed to activate."));
      }
    };

    worker.addEventListener("statechange", handleStateChange);
    handleStateChange();
  });
};

const getServiceWorkerRegistration = async () => {
  if (!("serviceWorker" in navigator)) return null;

  const serviceWorkerUrl = new URL(firebaseMessagingWorkerUrl, window.location.origin);
  const scope = new URL(".", serviceWorkerUrl).pathname;
  const scopeUrl = new URL(scope, window.location.origin).href;

  try {
    const existingRegistration = (
      await navigator.serviceWorker.getRegistrations()
    ).find(
      (registration) => registration.scope === scopeUrl && [
        registration.active?.scriptURL,
        registration.installing?.scriptURL,
        registration.waiting?.scriptURL,
      ].includes(serviceWorkerUrl.href)
    );

    if (existingRegistration) {
      return await waitForActiveWorker(existingRegistration);
    }

    const registration = await navigator.serviceWorker.register(
      serviceWorkerUrl,
      { scope, type: "module" }
    );

    return await waitForActiveWorker(registration);
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
    icon: "/pwa-192.png",
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
