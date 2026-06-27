import { useEffect, useState } from "react";

import {
  Moon,
  Sun,
} from "lucide-react";

export default function ThemeToggle({
  dark,
  setDark,
}) {
  const [mounted, setMounted] =
    useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const toggleTheme = () => {
    const nextTheme = !dark;

    setDark(nextTheme);

    localStorage.setItem(
      "unihelp-theme",
      nextTheme
        ? "dark"
        : "light"
    );
  };

  return (
    <button
      onClick={toggleTheme}
      className={`group relative flex items-center w-13 h-6 rounded-full transition-all duration-500 overflow-hidden shadow-xl ${
        dark
          ? "bg-linear-to-r from-indigo-600 via-purple-600 to-slate-900"
          : "bg-linear-to-r from-yellow-300 via-orange-300 to-pink-300"
      }`}
    >
      {/* BACKGROUND GLOW */}

      <div
        className={`absolute inset-0 opacity-40 blur-2xl transition-all duration-500 ${
          dark
            ? "bg-purple-500"
            : "bg-yellow-300"
        }`}
      />

      {/* STARS */}

      {dark && (
        <>
          <span className="absolute top-2 left-3 w-1 h-1 bg-white rounded-full animate-pulse" />

          <span className="absolute bottom-2 left-6 w-1 h-1 bg-white rounded-full animate-pulse delay-200" />

          <span className="absolute top-3 right-5 w-1 h-1 bg-white rounded-full animate-pulse delay-500" />
        </>
      )}

      {/* SLIDER */}

      <div
        className={`relative z-10 h-6 w-6 rounded-full flex items-center justify-center transform transition-all duration-500 shadow-lg ${
          dark
            ? "translate-x-8 bg-slate-950 text-yellow-300 rotate-180"
            : " bg-white text-orange-500 rotate-0"
        }`}
      >
        {dark ? (
          <Moon
            size={18}
            className="animate-pulse"
          />
        ) : (
          <Sun
            size={18}
            className="animate-spin-slow"
          />
        )}
      </div>

      {/* LABEL */}

      <span
        className={`absolute text-[8px] font-bold tracking-wide transition-all duration-500 ${
          dark
            ? "left-3 text-white/80"
            : "right-3 text-orange-700"
        }`}
      >
        {dark
          ? "DARK"
          : "LIGHT"}
      </span>
    </button>
  );
}