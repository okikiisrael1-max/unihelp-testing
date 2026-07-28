import React, { useEffect, useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";

import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Sparkles,
  X,
} from "lucide-react";

/**
 * =====================================================
 * REUSABLE PROMOTION ADS BANNER
 * =====================================================
 *
 * FEATURES:
 * - Auto sliding ads
 * - Manual navigation
 * - Responsive layout
 * - Dark mode support
 * - CTA button
 * - Dismiss option
 * - Ad badge
 * - Optional image support
 * - Google ads compatible
 * - External/internal links
 * - Smooth animations
 * - Mobile friendly
 *
 * =====================================================
 * USAGE:
 * =====================================================
 *
 * <PromotionAdsBanner
 *   dark={dark}
 *   autoSlide={true}
 *   interval={5000}
 *   ads={ads}
 * />
 *
 */

const PromotionAdsBanner = ({
  dark = false,
  autoSlide = true,
  interval = 5000,
  showControls = true,
  dismissible = true,
  ads = [],
}) => {
  const navigate = useNavigate();

  const [current, setCurrent] = useState(0);

  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!autoSlide || ads.length <= 1) return;

    const timer = setInterval(() => {
      setCurrent((prev) =>
        prev === ads.length - 1 ? 0 : prev + 1
      );
    }, interval);

    return () => clearInterval(timer);
  }, [ads.length, autoSlide, interval]);

 
  const currentAd = useMemo(() => {
    return ads[current] || {};
  }, [ads, current]);

  if (!ads.length || hidden) return null;

  /* ===================================================== */
  /* NAVIGATION */
  /* ===================================================== */

  const nextSlide = () => {
    setCurrent((prev) =>
      prev === ads.length - 1 ? 0 : prev + 1
    );
  };

  const prevSlide = () => {
    setCurrent((prev) =>
      prev === 0 ? ads.length - 1 : prev - 1
    );
  };

  /* ===================================================== */
  /* HANDLE CLICK */
  /* ===================================================== */

  const handleAction = () => {
    if (!currentAd.buttonLink) return;

    if (currentAd.external) {
      window.open(currentAd.buttonLink, "_blank");
    } else {
      navigate(currentAd.buttonLink);
    }
  };

  /* ===================================================== */
  /* THEMES */
  /* ===================================================== */

  const themes = {
    default:
      "from-indigo-600 via-violet-600 to-purple-700",

    success:
      "from-emerald-500 via-green-500 to-teal-600",

    danger:
      "from-rose-500 via-red-500 to-orange-500",

    warning:
      "from-yellow-500 via-orange-500 to-amber-600",

    dark:
      "from-slate-800 via-slate-900 to-black",

    blue:
      "from-sky-500 via-blue-600 to-indigo-700",

    pink:
      "from-pink-500 via-fuchsia-600 to-purple-700",
  };

  const gradient =
    themes[currentAd.theme] || themes.default;

  return (
    <div className="relative w-full overflow-hidden rounded-[30px]">
      <div
        className={`relative overflow-hidden rounded-[30px] bg-gradient-to-br ${gradient} p-5 md:p-8 text-white shadow-2xl transition-all duration-500`}
      >
        {/* BACKGROUND GLOW */}

        <div className="absolute top-0 right-0 opacity-10">
          <Sparkles size={200} />
        </div>

        {/* DISMISS BUTTON */}

        {dismissible && (
          <button
            onClick={() => setHidden(true)}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition"
          >
            <X size={18} />
          </button>
        )}

        {/* MAIN CONTENT */}

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* LEFT */}

          <div className="flex-1 w-full">
            {/* BADGE */}

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-sm font-medium mb-5 border border-white/10">
              <Sparkles size={15} />

              {currentAd.badge || "Sponsored"}
            </div>

            {/* TITLE */}

            <h2 className="text-2xl md:text-4xl font-black leading-tight max-w-2xl">
              {currentAd.title}
            </h2>

            {/* DESCRIPTION */}

            <p className="mt-4 text-sm md:text-base text-white/80 leading-relaxed max-w-xl">
              {currentAd.description}
            </p>

            {/* CTA */}

            {currentAd.buttonText && (
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={handleAction}
                  className="px-5 py-3 rounded-2xl bg-white text-black font-bold hover:scale-105 transition-all duration-300 flex items-center gap-2"
                >
                  {currentAd.buttonText}

                  <ExternalLink size={18} />
                </button>

                {currentAd.secondaryButton && (
                  <button
                    onClick={() => {
                      if (
                        !currentAd.secondaryButtonLink
                      ) {
                        return;
                      }

                      if (
                        currentAd.secondaryExternal
                      ) {
                        window.open(
                          currentAd.secondaryButtonLink,
                          "_blank"
                        );
                      } else {
                        navigate(
                          currentAd.secondaryButtonLink
                        );
                      }
                    }}
                    className="px-5 py-3 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md hover:bg-white/20 transition"
                  >
                    {currentAd.secondaryButton}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* RIGHT IMAGE */}

          {currentAd.image && (
            <div className="w-full lg:w-[320px] flex justify-center">
              <img
                src={currentAd.image}
                alt={currentAd.title}
                className="w-full max-w-[320px] rounded-3xl object-cover shadow-2xl border border-white/10"
              />
            </div>
          )}
        </div>

        {/* CONTROLS */}

        {showControls && ads.length > 1 && (
          <>
            {/* LEFT */}

            <button
              onClick={prevSlide}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/20 transition"
            >
              <ChevronLeft size={20} />
            </button>

            {/* RIGHT */}

            <button
              onClick={nextSlide}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/20 transition"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* INDICATORS */}

        {ads.length > 1 && (
          <div className="flex items-center justify-center gap-2 mt-7">
            {ads.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrent(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  current === index
                    ? "w-8 bg-white"
                    : "w-2 bg-white/40"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PromotionAdsBanner;

/* ===================================================== */
/* EXAMPLE ADS */
/* ===================================================== */

export const demoAds = [
  {
    badge: "🔥 Featured",

    title: "Get Premium Access To UniHelp",

    description:
        "Unlock premium learning, AI tools, advanced CBT practice and more student features.",
  },

  {
    badge: "📚 Academic",

    title: "Practice JAMB Questions Daily",

    description:
      "Boost your JAMB score with CBT simulations and daily quizzes.",

    buttonText: "Start Practicing",

    buttonLink: "/subjects",

    theme: "success",
  },

  {
    badge: "🏠 Hostel",

    title: "Find Verified Student Hostels",

    description:
      "Browse affordable and verified hostels near your campus.",

    buttonText: "View Hostels",

    buttonLink: "/hostelmarketplace",

    theme: "blue",
  },

  {
    badge: "💰 Sponsored",

    title: "Advertise Your Brand On UniHelp",

    description:
      "Reach thousands of students daily through banners and sponsored posts.",

    buttonText: "Advertise Now",

    buttonLink: "/contact",

    theme: "pink",

    external: false,
  },
];

/* ===================================================== */
/* USAGE EXAMPLE */
/* ===================================================== */

/**
 * import PromotionAdsBanner, {
 *   demoAds,
 * } from "../components/PromotionAdsBanner";
 *
 * <PromotionAdsBanner
 *   dark={dark}
 *   ads={demoAds}
 *   autoSlide={true}
 *   interval={4000}
 * />
 *
 */
