import React, { useContext, useEffect, useMemo, useState } from "react";
import { Images } from "./../data/data";
import {
  Bell,
  ChevronDown,
  MenuIcon,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../firebase/config";
import { AuthContext } from "../context/AuthContext";
import { Link, NavLink } from "react-router-dom";
import ProBtn from "./ProBtn";
import ThemeToggle from "./ThemeToggle";

const Navbar = ({ dark, setDark, setMenuOpen, menuOpen }) => {
  const { user } = useContext(AuthContext);
  const [searchOpen, setSearchOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const toggleTheme = () => setDark(!dark);

  /* ------------------------------------------------ */
  /* LIVE UNREAD NOTIFICATION COUNT */
  /* ------------------------------------------------ */
  // Mirrors the "notifications/{uid}/items" + `read` field convention used
  // in NotificationsCenter.jsx. onSnapshot keeps this live: reading a
  // notification anywhere in the app (or a new one arriving) updates the
  // badge immediately, no refresh needed.
  useEffect(() => {
    if (!user?.uid) {
      setUnreadCount(0);
      return;
    }

    const unreadQuery = query(
      collection(db, "notifications", user.uid, "items"),
      where("read", "==", false)
    );

    const unsubscribe = onSnapshot(
      unreadQuery,
      (snap) => setUnreadCount(snap.size),
      (err) => console.log(err)
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const desktopNavItems = useMemo(
    () => [
      {
        label: "Dashboard",
        to: "/",
      },
      {
        label: "Quick Tools",
        children: [
          { label: "Study Resources", to: "/resources" },
          { label: "CBT practice", to: "/cbt-practice" },
          { label: "Find Hostels", to: "/hostelmarketplace" },
          { label: "StudentMarketplace", to: "/studentmarketplace" },
          { label: "AI Assistance", to: "/ai" },
        ],
      },
      {
        label: "Features",
        to: "/features",
      },
      {
        label: "Support",
        to: "/help-center",
      },
    ],
    []
  );

  const theme = {
    header: dark
      ? "bg-slate-950/90 text-white border-slate-800"
      : "bg-white/90 text-slate-900 border-slate-200",
    card: dark
      ? "bg-white/5 border-white/10 hover:bg-white/10"
      : "bg-slate-50 border-slate-200 hover:bg-slate-100",
    input: dark
      ? "bg-white/5 border-white/10 placeholder:text-slate-500"
      : "bg-slate-50 border-slate-200 placeholder:text-slate-400",
    kbd: dark ? "bg-white/10 text-slate-400" : "bg-white text-slate-400",
  };

  return (
    <header
      className={`fixed top-0 left-0 z-50 md:z-100 w-full border-b shadow-sm backdrop-blur-xl transition-colors duration-300 ${theme.header}`}>
      <div className="flex h-16 w-full items-center gap-3 px-4 sm:px-6 lg:px-8">
        {/* LOGO */}
        <Link to="/" className="flex shrink-0 items-center cursor-pointer">
          <img
            src={Images.logo}
            alt="unihelp.ng"
            className="h-9 w-auto sm:h-10 md:h-11 transition-none"
          />
        </Link>

        {/* SEARCH — desktop */}
        <div className="relative hidden md:flex flex-1 max-w-md ml-4 xl:ml-6">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none"/>
          <input
            type="text"
            placeholder="Search for notes, questions, tutorials..."
            className={`w-full h-10 pl-10 pr-14 rounded-xl border outline-none text-sm transition-colors ${theme.input}`}/>
          <span
            className={`absolute right-3 top-1/2 -translate-y-1/2 hidden lg:flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${theme.kbd}`}>
            Ctrl+K
          </span>
        </div>

        {/* DESKTOP NAV */}
        <nav className="hidden lg:flex items-center gap-2 xl:gap-3 ml-6">
          {desktopNavItems.map((item) =>
            item.children ? (
              <div key={item.label} className="group relative">
                <button className="flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium transition hover:bg-indigo-500/10 hover:text-indigo-500">
                  {item.label}
                  <ChevronDown size={15} />
                </button>
                <div className="invisible absolute left-0 top-full mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl opacity-0 transition-all group-hover:visible group-hover:opacity-100 dark:border-slate-800 dark:bg-slate-950">
                  {item.children.map((child) => (
                    <NavLink
                      key={child.to}
                      to={child.to}
                      className="flex rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                    >
                      {child.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-full px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-indigo-500 text-white"
                      : "text-slate-600 hover:bg-indigo-500/10 hover:text-indigo-500 dark:text-slate-300"
                  }`
                }
              >
                {item.label}
              </NavLink>
            )
          )}
        </nav>

        

        {/* RIGHT ACTIONS */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3 ml-auto">
          {!user ? (
            <Link
              to="/login"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-indigo-500 px-3 sm:px-4 text-sm font-semibold text-white transition hover:bg-indigo-600"
            >
              Sign in
            </Link>
          ) : (
            <>
              <ProBtn />

              {/* SEARCH — mobile toggle */}
              <button
                onClick={() => setSearchOpen((v) => !v)}
                className={`md:hidden w-10 h-10 rounded-xl border flex items-center justify-center transition ${theme.card}`}
                aria-label="Search">
                {searchOpen ? <X size={18} /> : <Search size={18} />}
              </button>

              <Link
                to="/notifications"
                className={`relative flex w-10 h-10 rounded-xl border items-center justify-center transition ${theme.card}`}
                aria-label={
                  unreadCount > 0
                    ? `Notifications, ${unreadCount} unread`
                    : "Notifications"
                }
              >
                <Bell size={17} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-indigo-500 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
              <Link
                to="/profile"
                className="hidden sm:flex w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 items-center justify-center border border-indigo-500/20 overflow-hidden shrink-0"
                aria-label="Profile">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user?.displayName || "Profile"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-bold uppercase">
                    {user?.displayName ? user.displayName[0] : "U"}
                  </span>
                )}
              </Link>
            </>
          )}

          {/* MOBILE MENU TOGGLE */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`lg:hidden w-10 h-10 rounded-xl border flex items-center justify-center transition ${theme.card}`}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? <X size={19} /> : <MenuIcon size={19} />}
          </button>
        </div>
      </div>

      {/* SEARCH — mobile expandable row */}
      {searchOpen && (
        <div className={`md:hidden border-t px-4 py-3 ${theme.header}`}>
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none"
            />
            <input
              type="text"
              autoFocus
              placeholder="Search for notes, questions, tutorials..."
              className={`w-full h-10 pl-10 pr-4 rounded-xl border outline-none text-sm transition-colors ${theme.input}`}
            />
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;