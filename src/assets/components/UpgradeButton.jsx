import {
  Crown,
  ArrowRight,
  Loader2,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import {
  useEffect,
  useState,
} from "react";

import {
  auth,
  db,
} from "../../firebase/config";

import {
  doc,
  onSnapshot,
} from "firebase/firestore";

export default function UpgradeButton({
  dark,
}) {
  const navigate =
    useNavigate();

  const [loading, setLoading] =
    useState(true);

  const [isPremium, setIsPremium] =
    useState(false);

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const unsub =
      onSnapshot(
        doc(
          db,
          "users",
          auth.currentUser.uid
        ),
        (snap) => {
          if (snap.exists()) {
            setIsPremium(
              snap.data()
                ?.premium ===
                true
            );
          }

          setLoading(false);
        }
      );

    return () => unsub();
  }, []);

  /* =====================================
     HIDE FOR PREMIUM USERS
  ===================================== */

  if (
    loading ||
    isPremium ||
    !auth.currentUser
  ) {
    return null;
  }

  return (
    <button
      onClick={() =>
        navigate("/premium")
      }
      className={`group relative overflow-hidden px-6 py-3 rounded-2xl font-semibold transition-all duration-300 flex items-center gap-3 shadow-lg hover:scale-105 active:scale-95 ${
        dark
          ? "bg-linear-to-r from-yellow-500 via-amber-500 to-orange-500 text-black"
          : "bg-linear-to-r from-indigo-600 via-purple-600 to-pink-600 text-white"
      }`}
    >
      {/* GLOW */}

      <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-300 bg-white/10" />

      {/* ANIMATED SHINE */}

      <span className="absolute top-0 -left-full h-full w-1/2 bg-white/20 skew-x-12 group-hover:left-[150%] transition-all duration-1000" />

      {/* ICON */}

      <span className="relative z-10 flex items-center justify-center w-9 h-9 rounded-full bg-white/20 backdrop-blur-md">
        <Crown
          size={18}
          className="animate-pulse"
        />
      </span>

      {/* TEXT */}

      <div className="relative z-10 flex flex-col items-start leading-tight">
        <span className="text-xs opacity-80 uppercase tracking-wide">
          Premium Access
        </span>

        <span className="text-sm md:text-base font-black">
          Upgrade Account
        </span>
      </div>

      {/* ARROW */}

      <ArrowRight
        size={20}
        className="relative z-10 ml-1 transition-transform duration-300 group-hover:translate-x-1"
      />
    </button>
  );
}