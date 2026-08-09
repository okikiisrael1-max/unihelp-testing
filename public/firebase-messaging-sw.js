// This file is intentionally left as a public stub.
// The real Firebase messaging service worker is built from
// src/firebase/firebase-messaging-sw.js and registered as a module.

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
