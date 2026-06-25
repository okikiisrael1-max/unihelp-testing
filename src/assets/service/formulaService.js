import {
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "../../firebase/config";

export const getFormulas = async () => {
  try {
    const querySnapshot = await getDocs(
      collection(db, "formulas")
    );

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.log(error);

    return [];
  }
};