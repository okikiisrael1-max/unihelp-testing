import React, { useContext, useMemo, useState } from "react";
import {
  BarChart3, BookOpen, BrainCircuit, ChevronRight, Clock3,
  FileQuestion, GraduationCap, LayoutDashboard, Medal,
  PlayCircle, Settings, Trophy, Target, WalletCards, X,
  User2, Sparkles, Library, Sigma, Bookmark, Calculator,
  Brain, ShieldAlert, MessageCircleMore, Bell, ShieldCheck,
  LogOut, Loader2,
} from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase/config";
import { AuthContext } from "../context/AuthContext";

const JambSidebar = ({ dark = false, sidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [loggingOut, setLoggingOut] = useState(false);

  /* ── THEME ─────────────────────────────────────────────── */
  const theme = dark
    ? {
        sidebar: "bg-[#0a1628] border-white/10 text-white",
        glass: "bg-white/5 border border-white/10",
        glassHover: "hover:bg-white/8",
        muted: "text-white/45",
        sectionLabel: "text-white/30",
        divider: "border-white/8",
        active:
          "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25",
        inactive: "text-white/70 hover:bg-white/6 hover:text-white",
        badge: {
          inactive: "bg-indigo-500/15 text-indigo-300",
          active: "bg-white/20 text-white",
        },
        logout:
          "bg-red-500/12 border border-red-500/30 text-red-400 hover:bg-red-500/20",
      }
    : {
        sidebar: "bg-slate-50 border-slate-200 text-slate-900",
        glass: "bg-white border border-slate-200",
        glassHover: "hover:bg-slate-100",
        muted: "text-slate-500",
        sectionLabel: "text-slate-400",
        divider: "border-slate-200",
        active:
          "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20",
        inactive: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        badge: {
          inactive: "bg-indigo-500/10 text-indigo-600",
          active: "bg-white/20 text-white",
        },
        logout:
          "bg-red-50 border border-red-200 text-red-500 hover:bg-red-100",
      };

  /* ── USERNAME ───────────────────────────────────────────── */
  const username = useMemo(() => {
    if (!user?.displayName) return "Student";
    return user.displayName.split(" ")[0];
  }, [user]);

  /* ── LOGOUT ─────────────────────────────────────────────── */
  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error(error);
    } finally {
      setLoggingOut(false);
    }
  };

  /* ── NAV SECTIONS ───────────────────────────────────────── */
  const navSections = [
    {
      title: "MAIN",
      items: [
        { icon: <LayoutDashboard size={18} />, title: "Dashboard",      path: "/" },
        { icon: <PlayCircle size={18} />,      title: "CBT Practice",   path: "/subjects",       badge: "LIVE" },
        { icon: <FileQuestion size={18} />,    title: "Past Questions",  path: "/subjects-list" },
        { icon: <BrainCircuit size={18} />,    title: "AI Tutor",        path: "/ai-tutor",       badge: "AI" },
        { icon: <BookOpen size={18} />,        title: "Study Materials", path: "/materials" },
        { icon: <Bell size={18} />,            title: "Announcements",   path: "/announcements",  badge: "NEW" },
      ],
    },
    {
      title: "FORMULA HUB",
      items: [
        { icon: <Library size={18} />,     title: "Formula Hub",        path: "/formula-hub" },
        { icon: <Sigma size={18} />,       title: "Subjects",           path: "/formula-hub/subjects" },
        { icon: <Bookmark size={18} />,    title: "Bookmarks",          path: "/formula-hub/bookmarks" },
        { icon: <Calculator size={18} />,  title: "Calculations",       path: "/formula-calculator" },
        { icon: <Brain size={18} />,       title: "AI Formula Explain", path: "/formula-ai",     badge: "NEW" },
      ],
    },
    {
      title: "PERFORMANCE",
      items: [
        { icon: <BarChart3 size={18} />, title: "Analytics",    path: "/analytics" },
        { icon: <Target size={18} />,    title: "Goals",         path: "/goals" },
        { icon: <Trophy size={18} />,    title: "Leaderboard",   path: "/leaderboard" },
        { icon: <Medal size={18} />,     title: "Achievements",  path: "/achievements" },
      ],
    },
    {
      title: "ACCOUNT",
      items: [
        { icon: <Clock3 size={18} />,           title: "Study Planner",    path: "/planner" },
        { icon: <WalletCards size={18} />,      title: "Subscription",     path: "/subscription",  badge: "PRO" },
        { icon: <Settings size={18} />,         title: "Settings",         path: "/settings" },
        { icon: <ShieldAlert size={18} />,      title: "Report Issue",     path: "/report" },
        { icon: <MessageCircleMore size={18} />,title: "Contact Support",  path: "/contact" },
      ],
    },
  ];

  /* ── RENDER ─────────────────────────────────────────────── */
  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-50
          h-[100dvh] flex flex-col
          w-[85vw] max-w-[320px] sm:w-[320px] lg:w-[300px]
          border-r transition-transform duration-300
          ${theme.sidebar}
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Ambient glow */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full">

          {/* ── HEADER ── */}
          <div className={`p-4 border-b ${theme.divider} shrink-0`}>

            {/* Brand row */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
                  <GraduationCap size={22} className="text-white" />
                </div>
                <div>
                  <h1 className="font-black text-lg leading-tight tracking-tight">UniHelp.ng</h1>
                  <p className={`text-[11px] ${theme.muted}`}>Smart JAMB System</p>
                </div>
              </div>

              {/* Close — mobile only */}
              <button
                onClick={() => setSidebarOpen(false)}
                className={`lg:hidden w-9 h-9 rounded-xl flex items-center justify-center ${theme.glass}`}
                aria-label="Close sidebar"
              >
                <X size={16} />
              </button>
            </div>

            {/* User card */}
            <div className={`rounded-2xl p-3.5 ${theme.glass}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {username?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate leading-tight">
                    {user?.displayName || "Student"}
                  </p>
                  <p className={`text-xs truncate mt-0.5 ${theme.muted}`}>
                    {user?.email}
                  </p>
                </div>
              </div>

              <Link
                to="/profile"
                className="flex items-center justify-between rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-3.5 py-2.5 text-white shadow-md shadow-indigo-500/25 transition-opacity hover:opacity-90"
              >
                <div className="flex items-center gap-2">
                  <User2 size={15} />
                  <span className="text-xs font-semibold">View Profile</span>
                </div>
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>

          {/* ── NAVIGATION ── */}
          <nav
            className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
            aria-label="Sidebar navigation"
          >
            {navSections.map((section, si) => (
              <div key={si}>
                <p className={`text-[9.5px] font-bold tracking-[0.2em] mb-2 px-2 ${theme.sectionLabel}`}>
                  {section.title}
                </p>

                <div className="space-y-0.5">
                  {section.items.map((item, ii) => (
                    <NavLink
                      key={ii}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) =>
                        `group flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 ${
                          isActive ? theme.active : `${theme.inactive}`
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center gap-3 min-w-0">
                            <span className={`shrink-0 transition-transform duration-200 ${isActive ? "scale-110" : "group-hover:scale-110"}`}>
                              {item.icon}
                            </span>
                            <span className="text-[13px] font-medium truncate">
                              {item.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {item.badge && (
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${isActive ? theme.badge.active : theme.badge.inactive}`}>
                                {item.badge}
                              </span>
                            )}
                            <ChevronRight
                              size={13}
                              className={`transition-transform duration-200 opacity-50 ${isActive ? "translate-x-0.5 opacity-100" : "group-hover:translate-x-0.5 group-hover:opacity-100"}`}
                            />
                          </div>
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* ── FOOTER ── */}
          <div className={`p-3 border-t ${theme.divider} space-y-2.5 shrink-0`}>

            {/* Mock exam card */}
            <div className={`rounded-2xl p-3.5 ${theme.glass}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0">
                  <Sparkles size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-tight">Mock Exam Ready</p>
                  <p className={`text-xs mt-0.5 ${theme.muted}`}>Your next CBT starts soon</p>
                </div>
              </div>

              <Link
                to="/mock-setup"
                className="flex items-center justify-center gap-2 h-10 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-semibold shadow-md shadow-indigo-500/25 transition-opacity hover:opacity-90"
              >
                <PlayCircle size={15} />
                Start Mock Exam
              </Link>
            </div>

            {/* Upgrade */}
            <Link
              to="/subscription"
              className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3 text-white shadow-lg shadow-indigo-500/25 transition-opacity hover:opacity-90"
            >
              <div className="flex items-center gap-3">
                <ShieldCheck size={18} />
                <div>
                  <p className="text-xs font-semibold leading-tight">Upgrade to Premium</p>
                  <p className="text-[10px] opacity-75 mt-0.5">Unlock all AI tools</p>
                </div>
              </div>
              <ChevronRight size={15} />
            </Link>

            {/* Logout */}
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className={`w-full h-10 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all disabled:opacity-60 ${theme.logout}`}
            >
              {loggingOut ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Logging out…
                </>
              ) : (
                <>
                  <LogOut size={16} />
                  Logout
                </>
              )}
            </button>
          </div>

        </div>
      </aside>
    </>
  );
};

export default JambSidebar;
