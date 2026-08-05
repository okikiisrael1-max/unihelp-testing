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

    const themeValue = nextTheme ? "dark" : "light";

    localStorage.setItem("theme", themeValue);
    localStorage.setItem("unihelp-theme", themeValue);
  };

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className={`group relative flex h-8 w-16 items-center overflow-hidden rounded-full shadow-xl transition-all duration-500 ${
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
        className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full shadow-lg transform transition-all duration-500 ${
          dark
            ? "translate-x-8 bg-slate-950 text-yellow-300 rotate-180"
            : " bg-white text-orange-500 rotate-0"
        }`}
      >
        {dark ? (
          <Moon
            size={16}
            className="animate-pulse"
          />
        ) : (
          <Sun
            size={16}
            className="animate-spin-slow"
          />
        )}
      </div>

      {/* LABEL */}

      <span
        className={`absolute text-[9px] font-bold tracking-wide transition-all duration-500 ${
          dark
            ? "left-2 text-white/80"
            : "right-2 text-orange-700"
        }`}
      >
        {dark
          ? "DARK"
          : "LIGHT"}
      </span>
    </button>
  );
}
