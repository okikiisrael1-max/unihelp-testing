import React from "react";

import {
  Home,
  MessagesSquare,
  Sparkles,
  Newspaper,
  BookOpen,
} from "lucide-react";

import { NavLink, useLocation } from "react-router-dom";

const BottomBar = ({ dark }) => {
  const location = useLocation();
  const navItems = [
    {
      name: "Home",
      icon: Home,
      path: "/",
    },

    {
      name: "Connect",
      icon: MessagesSquare,
      path: "/community",
    },

    {
      name: "Study",
      icon: BookOpen,
      path: "/resources",
    },

    {
      name: "Feed",
      icon: Newspaper,
      path: "/newsfeed",
    },

    {
      name: "AI Help",
      icon: Sparkles,
      path: "/ai",
    },
  ];

  return (
    <>
      <div className="h-24 md:hidden" />

      <div className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
        <div
          className={`relative mx-auto max-w-xl rounded-2xl border p-1.5 shadow-[0_12px_40px_rgba(15,23,42,0.18)] backdrop-blur-xl ${
            dark ? "border-white/10 bg-[#0b1120]/95" : "border-slate-200 bg-white/95"
          }`}
        >
          <nav aria-label="Main navigation" className="flex items-center justify-around gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/"}
                  className={({ isActive: routeIsActive }) => {
                    const isActive = item.path === "/community"
                      ? routeIsActive || location.pathname === "/messages" || location.pathname.startsWith("/community/")
                      : routeIsActive;
                    return `group relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-inset active:scale-95 ${
                      isActive
                        ? dark
                          ? "bg-indigo-500/15 text-indigo-300"
                          : "bg-indigo-50 text-indigo-700"
                        : dark
                          ? "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`;
                  }}
                >
                  {({ isActive: routeIsActive }) => {
                    const isActive = item.path === "/community"
                      ? routeIsActive || location.pathname === "/messages" || location.pathname.startsWith("/community/")
                      : routeIsActive;
                    return (
                      <>
                        <Icon
                          size={20}
                          strokeWidth={isActive ? 2.4 : 1.9}
                          aria-hidden="true"
                          className="transition-transform duration-200 group-hover:-translate-y-0.5"
                        />
                        <span className={`relative z-10 text-[10px] font-semibold leading-none sm:text-[11px] ${
                          isActive ? "font-bold" : ""
                        }`}>
                          {item.name}
                        </span>
                      </>
                    );
                  }}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
};

export default BottomBar;
