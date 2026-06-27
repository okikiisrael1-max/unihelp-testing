import { Crown, Sparkles } from "lucide-react";
import { auth, db } from "../../firebase/config";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

export default function ProBtn({
  dark
}) {
  const navigate = useNavigate();

  const [isPremium, setIsPremium] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(
      doc(
        db,
        "users",
        auth.currentUser.uid
      ),
      (snap) => {
        if (snap.exists()) {
          setIsPremium(
            snap.data().premium ===
              true
          );
        }

        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

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
        navigate(
          "/premium"
        )
      }
      className={`group relative overflow-hidden flex items-center gap-2 px-5 py-2.5 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg ${
        dark
          ? "bg-linear-to-r from-yellow-400 via-orange-500 to-pink-500 text-white"
          : "bg-linear-to-r from-indigo-600 to-purple-600 text-white"
      }`}
    >
      {/* GLOW */}

      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-300 bg-white/10" />

      {/* ICON */}

      <div className="relative flex items-center justify-center">
        <Crown
          size={18}
          className="animate-pulse"
        />
      </div>

      {/* TEXT */}

      <div className="relative flex items-center gap-1">
        <span className="text-sm md:text-base">
          Upgrade
        </span>

        <Sparkles
          size={15}
          className="opacity-90"
        />
      </div>
    </button>
  );
}