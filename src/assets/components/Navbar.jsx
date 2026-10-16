import React, {
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Images } from "./../data/data";
import {
  Bell,
  Building2,
  ChevronDown,
  Calculator,
  CornerDownLeft,
  Home,
  LifeBuoy,
  MenuIcon,
  MessageCircleMore,
  Moon,
  PlayCircle,
  Search,
  ShoppingBag,
  Sparkles,
  Sun,
  Target,
  Trophy,
  UserRound,
  Users,
  BookOpen,
  X,
} from "lucide-react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../firebase/config";
import { AuthContext } from "../context/AuthContext";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import ProBtn from "./ProBtn";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

const isMac =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/i.test(navigator.platform || "");

/* ================================================= */
/* SEARCH PANEL (shared by desktop + mobile) */
/* ================================================= */

const SearchPanel = ({
  results,
  query: q,
  activeIndex,
  setActiveIndex,
  onSelect,
  dark,
  listId,
  columns,
  className = "",
}) => {
  const itemBase = dark
    ? "border-slate-800 bg-slate-950/50 hover:border-slate-600 hover:bg-slate-800"
    : "border-slate-100 bg-slate-50 hover:border-slate-300 hover:bg-white hover:shadow-md";
  const itemActive = dark
    ? "border-indigo-500/60 bg-slate-800"
    : "border-indigo-400 bg-white shadow-md";

  return (
    <div
      className={`rounded-2xl border shadow-2xl p-3 sm:p-4 z-50 ${
        dark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"
      } ${className}`}
    >
      <p className="text-xs font-semibold opacity-60 mb-3 px-1">
        {q ? "Search results" : "Popular pages"}
      </p>

      {results.length > 0 ? (
        <div
          id={listId}
          role="listbox"
          className={`grid gap-2 max-h-[60vh] overflow-y-auto pr-1 ${
            columns === 2 ? "grid-cols-2" : "grid-cols-1"
          }`}
        >
          {results.map((item, idx) => {
            const Icon = item.icon;
            const active = idx === activeIndex;
            const cls = `w-full text-left flex items-start p-3 rounded-xl border transition ${
              active ? itemActive : itemBase
            }`;
            const body = (
              <>
                <span
                  className={`flex items-center justify-center w-10 h-10 shrink-0 rounded-lg mr-3 ${item.colorClass}`}
                >
                  <Icon size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-sm truncate">
                    {item.title}
                  </span>
                  <span className="block text-xs opacity-60 mt-0.5 truncate">
                    {item.desc}
                  </span>
                </span>
                {active && (
                  <CornerDownLeft size={14} className="opacity-40 mt-1 shrink-0" />
                )}
              </>
            );

            // onMouseDown preventDefault keeps focus in the input so the panel doesn't close early
            return (
              <button
                key={item.title}
                type="button"
                role="option"
                id={`${listId}-${idx}`}
                aria-selected={active}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => onSelect(item)}
                className={cls}
              >
                {body}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="py-8 text-center">
          <p className="text-sm font-semibold">
            No pages match "{q}"
          </p>
          <p className="text-xs opacity-60 mt-1">
            Try a shorter word, like "exam", "hostel" or "video".
          </p>
        </div>
      )}
    </div>
  );
};

/* ================================================= */
/* DESKTOP DROPDOWN (hover, click and keyboard) */
/* ================================================= */

const NavDropdown = ({ item, dark }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { pathname } = useLocation();

  const childActive = item.children.some((c) => pathname.startsWith(c.to));

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
      onBlur={(e) => {
        if (!ref.current?.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium transition ${FOCUS_RING} ${
          childActive || open
            ? "bg-indigo-500/10 text-indigo-500"
            : `${dark ? "text-slate-300" : "text-slate-600"} hover:bg-indigo-500/10 hover:text-indigo-500`
        }`}
      >
        {item.label}
        <ChevronDown
          size={15}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* pt-2 (not margin) keeps the hover path continuous so the menu doesn't flicker shut */}
      {open && (
        <div className="absolute left-0 top-full pt-2 w-60">
          <div
            role="menu"
            className={`rounded-2xl border p-2 shadow-xl ${
              dark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"
            }`}
          >
            {item.children.map((child) => (
              <NavLink
                key={child.to}
                to={child.to}
                role="menuitem"
                className={({ isActive }) =>
                  `flex rounded-xl px-3 py-2 text-sm font-medium transition ${FOCUS_RING} ${
                    isActive
                      ? "bg-indigo-500/10 text-indigo-500"
                      : dark
                      ? "text-slate-300 hover:bg-slate-800 hover:text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`
                }
              >
                {child.label}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ================================================= */
/* NAVBAR */
/* ================================================= */

const Navbar = ({ dark, setDark, setMenuOpen, menuOpen }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  const desktopWrapRef = useRef(null);
  const mobileWrapRef = useRef(null);
  const desktopInputRef = useRef(null);

  const toggleTheme = () => setDark(!dark);

  /* ---------------- search data ---------------- */

  const searchDatabase = useMemo(
    () => [
      { type: "link", title: "Dashboard", desc: "Your home page", url: "/", icon: Home, colorClass: "bg-indigo-500/10 text-indigo-500", keywords: ["home", "main", "start"] },
      { type: "link", title: "CBT Practice", desc: "Practise with past questions", url: "/cbt-practice", icon: Target, colorClass: "bg-indigo-500/10 text-indigo-500", keywords: ["exam", "test", "quiz", "questions", "past questions", "cbt"] },
      { type: "link", title: "CGPA Tracker", desc: "Calculate and save your CGPA", url: "/CGPA", icon: Calculator, colorClass: "bg-teal-500/10 text-teal-500", keywords: ["cgpa", "gpa", "grade", "result", "score"] },
      { type: "link", title: "Formula Hub", desc: "Math, physics and chemistry formulas", url: "/formula-hub", icon: Calculator, colorClass: "bg-cyan-500/10 text-cyan-500", keywords: ["formula", "math", "physics", "chemistry", "calculate", "equations", "hub"] },
      { type: "link", title: "Study Resources", desc: "Notes, PDFs and study materials", url: "/resources", icon: BookOpen, colorClass: "bg-emerald-500/10 text-emerald-500", keywords: ["pdf", "read", "study", "materials", "handout", "notes", "resources"] },
      { type: "link", title: "Hostel Marketplace", desc: "Find accommodation", url: "/hostelmarketplace", icon: Building2, colorClass: "bg-rose-500/10 text-rose-500", keywords: ["house", "rent", "lodge", "accommodation", "hostel", "room"] },
      { type: "link", title: "Student Marketplace", desc: "Buy and sell items", url: "/studentmarketplace", icon: ShoppingBag, colorClass: "bg-amber-500/10 text-amber-500", keywords: ["shop", "store", "buy", "sell", "products", "market"] },
      { type: "link", title: "Watch", desc: "Video tutorials", url: "/watch", icon: PlayCircle, colorClass: "bg-red-500/10 text-red-500", keywords: ["video", "youtube", "tutorial", "play", "learn"] },
      { type: "link", title: "AI Tutor", desc: "Ask questions, get answers", url: "/ai", icon: Sparkles, colorClass: "bg-purple-500/10 text-purple-500", keywords: ["bot", "chat", "help", "artificial", "intelligence", "ai", "tutor"] },
      { type: "link", title: "Daily Challenge", desc: "Earn XP with daily questions", url: "/challenge", icon: Trophy, colorClass: "bg-orange-500/10 text-orange-500", keywords: ["xp", "streak", "quiz", "daily", "challenge", "points"] },
      { type: "link", title: "Leaderboard", desc: "See top students", url: "/leaderboard", icon: Trophy, colorClass: "bg-yellow-500/10 text-yellow-500", keywords: ["rank", "top", "ranking", "leaderboard", "xp"] },
      { type: "link", title: "Community", desc: "Join student groups", url: "/community", icon: Users, colorClass: "bg-blue-500/10 text-blue-500", keywords: ["forum", "group", "social", "friends", "groups"] },
      { type: "link", title: "Messages", desc: "Chat with other students", url: "/messages", icon: MessageCircleMore, colorClass: "bg-sky-500/10 text-sky-500", keywords: ["chat", "dm", "inbox", "message", "connect"] },
      { type: "link", title: "Help and Support", desc: "FAQs and contact", url: "/help-center", icon: LifeBuoy, colorClass: "bg-slate-500/10 text-slate-500", keywords: ["contact", "faq", "help", "support", "customer"] },
      { type: "link", title: "Profile and Settings", desc: "Manage your account", url: "/profile", icon: UserRound, colorClass: "bg-slate-500/10 text-slate-500", keywords: ["account", "settings", "preferences", "edit", "password", "profile"] },
      {
        type: "action",
        title: dark ? "Switch to light mode" : "Switch to dark mode",
        desc: "Change how UniHelp looks",
        action: toggleTheme,
        icon: dark ? Sun : Moon,
        colorClass: "bg-slate-500/10 text-slate-500",
        keywords: ["theme", "dark", "light", "darkmode", "lightmode", "appearance", "color"],
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dark]
  );

  const searchResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return searchDatabase.slice(0, 6);

    return searchDatabase.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q) ||
        item.keywords?.some((k) => k.includes(q))
    );
  }, [searchDatabase, searchQuery]);

  useEffect(() => setActiveIndex(0), [searchQuery]);

  const closeSearch = () => {
    setPanelOpen(false);
    setSearchQuery("");
    setMobileSearchOpen(false);
  };

  const handleSelect = (item) => {
    if (item.type === "action") item.action();
    else navigate(item.url);
    closeSearch();
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setPanelOpen(true);
      setActiveIndex((i) => (searchResults.length ? (i + 1) % searchResults.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) =>
        searchResults.length ? (i - 1 + searchResults.length) % searchResults.length : 0
      );
    } else if (e.key === "Enter") {
      const item = searchResults[activeIndex];
      if (item) {
        e.preventDefault();
        handleSelect(item);
        e.currentTarget.blur();
      }
    }
  };

  /* ---------------- global keys + outside click ---------------- */

  useEffect(() => {
    const onKey = (e) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (window.matchMedia("(min-width: 768px)").matches) {
          desktopInputRef.current?.focus();
        } else {
          setMobileSearchOpen(true);
          setPanelOpen(true);
        }
      }
      if (e.key === "Escape") {
        desktopInputRef.current?.blur();
        setPanelOpen(false);
        setMobileSearchOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!panelOpen) return;
    const onDown = (e) => {
      const inside =
        desktopWrapRef.current?.contains(e.target) ||
        mobileWrapRef.current?.contains(e.target);
      if (!inside) setPanelOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [panelOpen]);

  // Close search whenever the route changes
  useEffect(() => {
    setPanelOpen(false);
    setMobileSearchOpen(false);
  }, [pathname]);

  /* ---------------- unread notifications ---------------- */

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

  /* ---------------- nav items ---------------- */

  const desktopNavItems = useMemo(
    () => [
      { label: "Dashboard", to: "/", end: true },
      {
        label: "Quick tools",
        children: [
          { label: "Study resources", to: "/resources" },
          { label: "CBT practice", to: "/cbt-practice" },
          { label: "CGPA tracker", to: "/CGPA" },
          { label: "Find hostels", to: "/hostelmarketplace" },
          { label: "Student marketplace", to: "/studentmarketplace" },
          { label: "AI tutor", to: "/ai" },
        ],
      },
      { label: "Features", to: "/features" },
      { label: "Support", to: "/help-center" },
    ],
    []
  );

  /* ---------------- theme ---------------- */

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
    navIdle: dark ? "text-slate-300" : "text-slate-600",
  };

  const iconBtn = `relative flex w-10 h-10 rounded-xl border items-center justify-center transition hover:border-indigo-500/60 ${theme.card} ${FOCUS_RING}`;

  /* ================================================= */
  /* RENDER */
  /* ================================================= */

  return (
    <header
      className={`fixed top-0 left-0 z-50 md:z-[100] w-full border-b shadow-sm backdrop-blur-xl transition-colors duration-300 ${theme.header}`}
    >
      <div className="flex h-16 w-full items-center gap-3 px-4 sm:px-6 lg:px-8">
        {/* LOGO */}
        <Link
          to="/"
          aria-label="UniHelp home"
          className={`flex shrink-0 items-center rounded-lg ${FOCUS_RING}`}
        >
          <img
            src={Images.logo}
            alt="unihelp.ng"
            className="h-9 w-auto sm:h-10 md:h-11"
          />
        </Link>

        {/* SEARCH, desktop */}
        <div
          ref={desktopWrapRef}
          className="relative hidden md:flex flex-1 max-w-xl ml-4 xl:ml-6 group"
        >
          <Search
            size={16}
            className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
              panelOpen
                ? "text-indigo-500"
                : "opacity-50 group-hover:text-indigo-500 group-hover:opacity-100"
            }`}
          />
          <input
            ref={desktopInputRef}
            type="text"
            role="combobox"
            aria-expanded={panelOpen}
            aria-controls="desktop-search-list"
            aria-activedescendant={
              panelOpen ? `desktop-search-list-${activeIndex}` : undefined
            }
            aria-label="Search UniHelp"
            autoComplete="off"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPanelOpen(true);
            }}
            onFocus={() => setPanelOpen(true)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search pages and tools"
            className={`w-full h-10 pl-10 pr-16 rounded-xl border outline-none text-sm transition-all duration-200 ${theme.input} ${
              panelOpen
                ? "border-indigo-500 bg-indigo-500/5 ring-2 ring-indigo-500/20"
                : "group-hover:border-indigo-500/50"
            }`}
          />
          {searchQuery ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setSearchQuery("");
                desktopInputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center opacity-60 hover:opacity-100 hover:bg-red-500/10 hover:text-red-500 transition"
            >
              <X size={14} />
            </button>
          ) : (
            <span
              aria-hidden="true"
              className={`absolute right-3 top-1/2 -translate-y-1/2 hidden lg:flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${theme.kbd}`}
            >
              {isMac ? "⌘K" : "Ctrl K"}
            </span>
          )}

          {panelOpen && (
            <SearchPanel
              results={searchResults}
              query={searchQuery}
              activeIndex={activeIndex}
              setActiveIndex={setActiveIndex}
              onSelect={handleSelect}
              dark={dark}
              listId="desktop-search-list"
              columns={2}
              className="absolute top-full mt-2 left-0 w-[520px] max-w-[90vw]"
            />
          )}
        </div>

        {/* DESKTOP NAV */}
        <nav aria-label="Main" className="hidden lg:flex items-center gap-1 xl:gap-2 ml-4">
          {desktopNavItems.map((item) =>
            item.children ? (
              <NavDropdown key={item.label} item={item} dark={dark} />
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-full px-3 py-2 text-sm font-medium transition ${FOCUS_RING} ${
                    isActive
                      ? "bg-indigo-500 text-white"
                      : `${theme.navIdle} hover:bg-indigo-500/10 hover:text-indigo-500`
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
          {/* SEARCH, mobile toggle (available to everyone) */}
          <button
            type="button"
            onClick={() => {
              setMobileSearchOpen((v) => !v);
              setPanelOpen(true);
            }}
            aria-label={mobileSearchOpen ? "Close search" : "Search"}
            aria-expanded={mobileSearchOpen}
            className={`md:hidden ${iconBtn}`}
          >
            {mobileSearchOpen ? <X size={18} /> : <Search size={18} />}
          </button>

          {!user ? (
            <Link
              to="/login"
              className={`inline-flex h-10 items-center justify-center rounded-xl bg-indigo-500 px-3 sm:px-4 text-sm font-semibold text-white transition hover:bg-indigo-600 ${FOCUS_RING}`}
            >
              Sign in
            </Link>
          ) : (
            <>
              <ProBtn />

              <Link
                to="/messages"
                aria-label="Messages"
                className={`hidden md:flex text-indigo-500 ${iconBtn}`}
              >
                <MessageCircleMore size={20} />
              </Link>

              <Link
                to="/notifications"
                className={iconBtn}
                aria-label={
                  unreadCount > 0
                    ? `Notifications, ${unreadCount} unread`
                    : "Notifications"
                }
              >
                <Bell size={17} />
                {unreadCount > 0 && (
                  <span
                    aria-hidden="true"
                    className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-indigo-500 px-1 text-[10px] font-bold text-white"
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>

              <Link
                to="/profile"
                className={`hidden sm:flex w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 items-center justify-center border border-indigo-500/20 overflow-hidden shrink-0 ${FOCUS_RING}`}
                aria-label="Profile"
              >
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt=""
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
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className={`lg:hidden ${iconBtn}`}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={!!menuOpen}
          >
            {menuOpen ? <X size={19} /> : <MenuIcon size={19} />}
          </button>
        </div>
      </div>

      {/* SEARCH, mobile expandable row */}
      {mobileSearchOpen && (
        <div
          ref={mobileWrapRef}
          className={`md:hidden border-t px-4 py-3 ${theme.header}`}
        >
          <div className="relative">
            <Search
              size={16}
              className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                panelOpen ? "text-indigo-500" : "opacity-50"
              }`}
            />
            <input
              type="text"
              role="combobox"
              aria-expanded={panelOpen}
              aria-controls="mobile-search-list"
              aria-label="Search UniHelp"
              autoComplete="off"
              autoFocus
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPanelOpen(true);
              }}
              onFocus={() => setPanelOpen(true)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search pages and tools"
              className={`w-full h-11 pl-10 pr-10 rounded-xl border outline-none text-base sm:text-sm transition-colors ${theme.input} ${
                panelOpen ? "border-indigo-500 bg-indigo-500/5" : ""
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center opacity-60 hover:opacity-100"
              >
                <X size={14} />
              </button>
            )}

            {panelOpen && (
              <SearchPanel
                results={searchResults}
                query={searchQuery}
                activeIndex={activeIndex}
                setActiveIndex={setActiveIndex}
                onSelect={handleSelect}
                dark={dark}
                listId="mobile-search-list"
                columns={1}
                className="absolute top-full mt-2 left-0 right-0"
              />
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;