import React, { useEffect, useMemo, useState } from "react";

import { Outlet } from "react-router-dom";

import JambSidebar from "../components/JambSideBar";
import { Menu } from "lucide-react";
import Footer from "../components/Footer";

const JambLayout = ({
  dark,
  setDark,
}) => {
  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  /* ================= THEME ================= */

  useEffect(() => {
    const savedTheme =
      localStorage.getItem("jamb-theme");

    if (savedTheme) {
      setDark(savedTheme === "dark");
    }
  }, [setDark]);

  useEffect(() => {
    localStorage.setItem(
      "jamb-theme",
      dark ? "dark" : "light"
    );
  }, [dark]);

  /* ================= UI STYLES ================= */

  const glass = useMemo(() => {
    return dark
      ? "bg-white/5 border border-white/10 backdrop-blur-2xl"
      : "bg-white/80 border border-slate-200/80 backdrop-blur-xl";
  }, [dark]);

  const cardHover = useMemo(() => {
    return dark
      ? "hover:bg-white/10"
      : "hover:bg-slate-100";
  }, [dark]);

  const textFade = useMemo(() => {
    return dark
      ? "text-white/65"
      : "text-slate-500";
  }, [dark]);

  return (
    <div
      className={`relative min-h-screen w-full overflow-x-hidden transition-colors duration-300 ${
        dark ? "bg-[#020617] text-white" : "bg-[#f4f7fb] text-slate-900"
      }`}
    >
      {/* BACKGROUND GLOW */}

      <div className="fixed top-0 left-0 h-[22rem] w-[22rem] rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

      <div className="fixed bottom-0 right-0 h-[22rem] w-[22rem] rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />

      <div className="relative flex min-h-screen w-full">
        {/* SIDEBAR */}
        <JambSidebar
          dark={dark}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          glass={glass}
          cardHover={cardHover}
          textFade={textFade}
        />

        <div
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`lg:hidden fixed right-3 top-3 z-[511] flex h-12 w-12 items-center justify-center rounded-2xl shadow-2xl ${glass}`}>
          <Menu size={24} />
        </div>

        <main className="min-w-0 flex-1 overflow-x-hidden px-3 py-4 sm:px-4 sm:py-6 lg:px-6">
          <Outlet
            context={{
              dark,
              glass,
              cardHover,
              textFade,
              sidebarOpen,
              setSidebarOpen,
            }}
          />
          <Footer dark={dark}/>
        </main>
      </div>
    </div>
  );
};

export default JambLayout;
