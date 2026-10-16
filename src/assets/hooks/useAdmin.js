import { useContext, useEffect, useState } from "react";

import { doc, getDoc } from "firebase/firestore";

import { db } from "../../firebase/config";
import { AuthContext } from "../context/AuthContext";

export const ADMIN_EMAILS = new Set([
  "onakomayaokiki@gmail.com",
  "iadejuwon77@gmail.com",
  "agbajejoshua36@gmail.com",
]);

export const isUserAdmin = ({
  user,
  userData = {},
  tokenResult = null,
}) => {
  const email = String(
    user?.email || userData?.email || ""
  )
    .trim()
    .toLowerCase();

  const hasAdminEmail = ADMIN_EMAILS.has(email);
  const hasAdminClaim = Boolean(
    tokenResult?.claims?.admin
  );
  const hasAdminFlag =
    userData.admin === true ||
    userData.role === "admin" ||
    userData.userRole === "admin";

  return hasAdminEmail || hasAdminClaim || hasAdminFlag;
};

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

        if (!cancelled) {
          setIsAdmin(
            isUserAdmin({
              user,
              userData,
              tokenResult,
            })
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
