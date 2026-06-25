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
      className={`min-h-screen w-full absolute overflow-y-auto transition-all duration-300 ${
        dark ? "bg-[#020617] text-white" : "bg-[#f4f7fb] text-slate-900"
      }`}
    >
      {/* BACKGROUND GLOW */}

      <div className="fixed top-0 left-0 w-87.5 h-87.5 bg-indigo-500/20 blur-3xl rounded-full pointer-events-none" />

      <div className="fixed bottom-0 right-0 w-87.5 h-87.5 bg-purple-500/20 blur-3xl rounded-full pointer-events-none" />

      <div className="relative overflow-y-scroll flex">
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
          className={`lg:hidden fixed right-3 top-3 w-12 h-12 z-511 rounded-2xl flex items-center justify-center shadow-2xl ${glass}`}>
          <Menu size={24} />
        </div>

        <main className="overflow-y-scroll h-screen flex-1 p-2.5">
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
          <Footer/>
        </main>
      </div>
    </div>
  );
};

export default JambLayout;