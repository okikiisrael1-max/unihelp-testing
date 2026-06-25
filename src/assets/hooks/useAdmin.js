import { useContext, useEffect, useState } from "react";

import { doc, getDoc } from "firebase/firestore";

import { db } from "../../firebase/config";
import { AuthContext } from "../context/AuthContext";

const ADMIN_EMAILS = new Set([
  "onakomayaokiki@gmail.com",
]);

export default function useAdmin() {
  const { user, loading: authLoading } =
    useContext(AuthContext);

  const [isAdmin, setIsAdmin] =
    useState(null);

  useEffect(() => {
    let cancelled = false;

    const resolveAdmin = async () => {
      if (authLoading) {
        setIsAdmin(null);
        return;
      }

      if (!user?.uid) {
        setIsAdmin(false);
        return;
      }

      try {
        const [tokenResult, userSnap] =
          await Promise.all([
            user
              .getIdTokenResult()
              .catch(() => null),
            getDoc(
              doc(db, "users", user.uid)
            ).catch(() => null),
          ]);

        const userData = userSnap?.exists()
          ? userSnap.data()
          : {};

        const hasAdminEmail = ADMIN_EMAILS.has(
          user.email
        );
        const hasAdminClaim = Boolean(
          tokenResult?.claims?.admin
        );
        const hasAdminFlag =
          userData.admin === true ||
          userData.role === "admin";

        if (!cancelled) {
          setIsAdmin(
            hasAdminEmail ||
              hasAdminClaim ||
              hasAdminFlag
          );
        }
      } catch (error) {
        console.error(
          "Failed to resolve admin status",
          error
        );

        if (!cancelled) {
          setIsAdmin(false);
        }
      }
    };

    resolveAdmin();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  return isAdmin;
}
