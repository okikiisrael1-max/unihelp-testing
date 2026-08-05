import { initializeApp } from "firebase/app";

import {
  getMessaging,
  getToken,
  onMessage,
} from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyDEMRFDhpvIU9--ZJ8SDXsFV0R6KkKKrLY",
  authDomain: "campusflow-c415d.firebaseapp.com",
  projectId: "campusflow-c415d",
  storageBucket: "campusflow-c415d.firebasestorage.app",
  messagingSenderId: "304872852414",
  appId: "1:304872852414:web:8d9736ead9d011003507ef",
  measurementId: "G-EGC0NCXY5W"
};

const app =
  initializeApp(firebaseConfig);

export const messaging =
  getMessaging(app);

export const requestNotificationPermission =
  async () => {
    try {
      const permission =
        await Notification.requestPermission();

      if (
        permission ===
        "granted"
      ) {
        const token =
          await getToken(
            messaging,
            {
              vapidKey:
                "BNSkrKfXIg968vhAb-KcSk7x5knlR67nEhIq-dlD7mGAbN1AgAABQlEmPq1ISNesMUvqW0JvyMQymywrAna0jv4",
            }
          );

        console.log(
          "FCM Token:",
          token
        );

        return token;
      }
    } catch (err) {
      console.log(err);
    }
  };

export const onMessageListener =
  () =>
    new Promise((resolve) => {
      onMessage(
        messaging,
        (payload) => {
          resolve(payload);
        }
      );
    });