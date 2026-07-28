import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getMessaging } from "firebase/messaging";

/* ===================================== */
/* FIREBASE CONFIG */
/* ===================================== */

const firebaseConfig = {
  apiKey: "AIzaSyDEMRFDhpvIU9--ZJ8SDXsFV0R6KkKKrLY",

  authDomain: "campusflow-c415d.firebaseapp.com",

  projectId: "campusflow-c415d",

  storageBucket: "campusflow-c415d.firebasestorage.app",

  messagingSenderId: "304872852414",

  appId: "1:304872852414:web:8d9736ead9d011003507ef",

  measurementId: "G-EGC0NCXY5W",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const messaging = getMessaging(app);
