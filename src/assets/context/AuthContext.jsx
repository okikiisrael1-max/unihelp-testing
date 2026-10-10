import { createContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../../firebase/config";



export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile = null;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      unsubscribeProfile?.();
      unsubscribeProfile = null;
      setUser(currentUser);
      setProfile(null);
      setLoading(false);

      if (currentUser) {
        unsubscribeProfile = onSnapshot(
          doc(db, "users", currentUser.uid),
          (snapshot) => {
            if (snapshot.exists()) {
              setProfile({ uid: currentUser.uid, id: snapshot.id, ...snapshot.data() });
            }
          },
          (error) => console.error("Could not fetch the signed-in user's profile:", error)
        );
      }
    });

    return () => {
      unsubscribeProfile?.();
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;