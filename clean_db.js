import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where, deleteDoc, doc } from "firebase/firestore";
import dotenv from "dotenv";
dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clean() {
  try {
    let count = 0;
    
    // Remove test products
    const q1 = query(collection(db, "studentMarketplace"));
    const snap1 = await getDocs(q1);
    for (const d of snap1.docs) {
      if (d.data().title && d.data().title.startsWith("Test Product")) {
        await deleteDoc(doc(db, "studentMarketplace", d.id));
        count++;
      }
    }

    // Remove test hostels
    const q2 = query(collection(db, "hostels"));
    const snap2 = await getDocs(q2);
    for (const d of snap2.docs) {
      if (d.data().title && d.data().title.startsWith("Test Hostel")) {
        await deleteDoc(doc(db, "hostels", d.id));
        count++;
      }
    }
    
    console.log("Success! Deleted", count, "documents");
    process.exit(0);
  } catch(e) {
    console.log("Error:", e.message);
    process.exit(1);
  }
}
clean();
