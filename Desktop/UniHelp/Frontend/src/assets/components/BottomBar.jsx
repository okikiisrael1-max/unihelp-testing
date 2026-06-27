import React from "react";

import {
  HomeIcon,
  MessageCircle,
  Video,
  WandSparklesIcon,
  CheckSquare,
} from "lucide-react";

import { NavLink } from "react-router-dom";

const BottomBar = ({ dark }) => {
  const navItems = [
    {
      name: "Home",
      icon: HomeIcon,
      path: "/",
    },

    {
      name: "Community",
      icon: MessageCircle,
      path: "/community",
    },

    {
      name: "Tutorials",
      icon: Video,
      path: "/tutorialmarketplace",
    },

    {
      name: "Tasks",
      icon: CheckSquare,
      path: "/tasks",
    },

    {
      name: "AI Help",
      icon: WandSparklesIcon,
      path: "/ai",
    },
  ];

  return (
    <>
      {/* =========================================================
         SAFE SPACING FOR MOBILE
      ========================================================= */}

      <div className="h-28 md:hidden" />

      {/* =========================================================
         MOBILE BOTTOM NAV
      ========================================================= */}

      <div className="md:hidden fixed bottom-0 left-0 w-full z-50 px-3 pb-3">
        <div
          className={`
            relative overflow-hidden
            rounded-[30px]
            border
            shadow-[0_20px_80px_rgba(0,0,0,0.35)]
            backdrop-blur-3xl
            transition-all duration-300
            ${dark ? "bg-[#0b1120]/90 border-white/10" : "bg-white/90 border-gray-200"}
          `}>

          {/* BACKGROUND GLOW */}

          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-linear-to-r from-indigo-500/10 via-purple-500/5 to-cyan-500/10" />

            <div className="absolute -top-10 left-10 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full" />

            <div className="absolute -bottom-10 right-10 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full" />
          </div>

          {/* NAV ITEMS */}

          <div className="relative flex items-center justify-between px-1 py-2">
            {navItems.map((item, index) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={index}
                  to={item.path}
                  className={({ isActive }) => `
                    relative flex flex-col items-center justify-center
                    flex-1
                    py-2
                    rounded-2xl
                    transition-all duration-300
                    active:scale-95

                    ${
                      isActive
                        ? dark
                          ? "text-white"
                          : "text-indigo-600"
                        : dark
                        ? "text-slate-400"
                        : "text-slate-500"
                    }
                  `}
                >
                  {({ isActive }) => (
                    <>
                      {/* ACTIVE BG */}

                      {isActive && (
                        <>
                          <div
                            className={`
                              absolute inset-1 rounded-2xl
                              ${
                                dark
                                  ? "bg-indigo-500/20 border border-indigo-400/20"
                                  : "bg-indigo-50 border border-indigo-100"
                              }
                            `}
                          />

                          {/* TOP INDICATOR */}

                          <div className="absolute top-0 w-8 h-1 rounded-full bg-indigo-500" />
                        </>
                      )}

                      {/* ICON */}

                      <div
                        className={`
                          relative z-10
                          h-10 w-10
                          rounded-2xl
                          flex items-center justify-center
                          transition-all duration-300

                          ${
                            isActive
                              ? dark
                                ? "bg-indigo-500 shadow-lg shadow-indigo-500/30"
                                : "bg-indigo-500 text-white shadow-lg shadow-indigo-200"
                              : dark
                              ? "bg-white/5"
                              : "bg-gray-100"
                          }
                        `}
                      >
                        <Icon
                          size={20}
                          className={`transition-all duration-300 ${
                            isActive
                              ? "scale-110"
                              : "scale-100"
                          }`}
                        />
                      </div>

                      {/* LABEL */}

                      <span
                        className={`
                          relative z-10
                          mt-1.5
                          text-[10px]
                          font-bold
                          tracking-wide
                          transition-all duration-300

                          ${
                            isActive
                              ? "opacity-100"
                              : "opacity-75"
                          }
                        `}>
                        {item.name}
                      </span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default BottomBar;