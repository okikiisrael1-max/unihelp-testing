import React, {
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Activity,
  ArrowRight,
  BarChart3,
  Bot,
  BookOpen,
  Calculator,
  ChevronRight,
  Flame,
  HistoryIcon,
  MessageCircle,
  PlayCircle,
  Search,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
  X,
} from "lucide-react";

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "../../firebase/config";
import { AuthContext } from "../context/AuthContext";

import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { Images } from "../data/data";
import { allFeatures, featureSections } from "../data/features";

/* ================================================= */
/* CONSTANTS */
/* ================================================= */

const TOOLS_PREVIEW_COUNT = 6;
const RECORDS_PREVIEW_COUNT = 4;

const QUICK_ACTIONS = [
  {
    label: "CGPA Tracker",
    hint: "Log a semester",
    to: "/CGPA",
    icon: Calculator,
    tint: "indigo",
  },
  {
    label: "AI Tutor",
    hint: "Ask anything",
    to: "/ai",
    icon: Bot,
    tint: "violet",
  },
  {
    label: "Watch",
    hint: "Video tutorials",
    to: "/watch",
    icon: PlayCircle,
    tint: "red",
  },
  {
    label: "Messages",
    hint: "Chat with students",
    to: "/messages",
    icon: MessageCircle,
    tint: "sky",
  },
  {
    label: "Groups",
    hint: "Join communities",
    to: "/community",
    icon: Users,
    tint: "emerald",
  },
];

// Written out in full so Tailwind can see every class at build time.
const TINTS = {
  indigo: {
    dark: "bg-indigo-500/15 text-indigo-300",
    light: "bg-indigo-50 text-indigo-600",
  },
  violet: {
    dark: "bg-violet-500/15 text-violet-300",
    light: "bg-violet-50 text-violet-600",
  },
  red: {
    dark: "bg-red-500/15 text-red-300",
    light: "bg-red-50 text-red-600",
  },
  sky: {
    dark: "bg-sky-500/15 text-sky-300",
    light: "bg-sky-50 text-sky-600",
  },
  amber: {
    dark: "bg-amber-500/15 text-amber-300",
    light: "bg-amber-50 text-amber-600",
  },
  emerald: {
    dark: "bg-emerald-500/15 text-emerald-300",
    light: "bg-emerald-50 text-emerald-600",
  },
};

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

const formatDate = (createdAt) => {
  if (!createdAt?.seconds) return "";
  return new Date(createdAt.seconds * 1000).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

/* ================================================= */
/* DASHBOARD */
/* ================================================= */

const Dashboard = ({ dark }) => {
  const { user } = useContext(AuthContext);

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [showAllRecords, setShowAllRecords] = useState(false);
  const [showAllTools, setShowAllTools] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");

  const searchRef = useRef(null);
  const toolsRef = useRef(null);

  /* ------------------------------------------------ */
  /* FETCH CGPA RECORDS */
  /* ------------------------------------------------ */

  useEffect(() => {
    if (user) {
      fetchRecords();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchRecords = async () => {
    try {
      const q = query(
        collection(db, "cgpaTracker"),
        where("userId", "==", user.uid)
      );

      const snap = await getDocs(q);

      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setRecords(data);
    } catch (err) {
      console.log(err);
      toast.error("Couldn't load your CGPA records");
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------------------ */
  /* DELETE RECORD */
  /* ------------------------------------------------ */

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "cgpaTracker", id));
      setRecords((prev) => prev.filter((item) => item.id !== id));
      toast.success("Record deleted");
    } catch (err) {
      console.log(err);
      toast.error("Couldn't delete that record");
    } finally {
      setConfirmDeleteId(null);
    }
  };

  /* ------------------------------------------------ */
  /* KEYBOARD SHORTCUT: press "/" to search tools */
  /* ------------------------------------------------ */

  const focusSearch = () => {
    toolsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    // wait for the scroll to start so the keyboard doesn't fight it on mobile
    setTimeout(() => searchRef.current?.focus({ preventScroll: true }), 250);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || e.target?.isContentEditable)
        return;
      e.preventDefault();
      focusSearch();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ------------------------------------------------ */
  /* SORT + STATS */
  /* ------------------------------------------------ */

  const sortedRecords = useMemo(() => {
    return [...records].sort(
      (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
    );
  }, [records]);

  const visibleRecords = showAllRecords
    ? sortedRecords
    : sortedRecords.slice(0, RECORDS_PREVIEW_COUNT);

  const dashboard = useMemo(() => {
    const values = records.map((r) => Number(r.cgpa) || 0);
    const total = values.length;

    return {
      totalRecords: total,
      bestCGPA: total ? Math.max(...values).toFixed(2) : "0.00",
      avgCGPA: total
        ? (values.reduce((a, b) => a + b, 0) / total).toFixed(2)
        : "0.00",
      latestCGPA: total ? (Number(sortedRecords[0]?.cgpa) || 0).toFixed(2) : "0.00",
    };
  }, [records, sortedRecords]);

  // Change since the previous saved record (more meaningful than vs. average)
  const cgpaChange =
    sortedRecords.length > 1
      ? (Number(sortedRecords[0]?.cgpa) || 0) -
        (Number(sortedRecords[1]?.cgpa) || 0)
      : 0;

  // Oldest -> newest, last 8, for the sparkline
  const sparkData = useMemo(() => {
    return [...sortedRecords]
      .reverse()
      .slice(-8)
      .map((r) => ({
        id: r.id,
        value: Number(r.cgpa) || 0,
        date: formatDate(r.createdAt),
      }));
  }, [sortedRecords]);

  const sparkMax = Math.max(...sparkData.map((d) => d.value), 0.01);

  /* ------------------------------------------------ */
  /* THEME */
  /* ------------------------------------------------ */

  const theme = {
    bg: dark ? "bg-[#070b14] text-white" : "bg-[#f6f7fb] text-gray-900",
    card: dark
      ? "bg-white/5 border border-white/10"
      : "bg-white border border-gray-200/80 shadow-sm",
    soft: dark ? "bg-white/5" : "bg-gray-50",
    input: dark
      ? "bg-white/5 border border-white/10 focus-within:border-indigo-400/60"
      : "bg-white border border-gray-200 focus-within:border-indigo-400",
    iconTint: dark
      ? "bg-indigo-500/15 text-indigo-300"
      : "bg-indigo-50 text-indigo-600",
    textSoft: dark ? "text-gray-400" : "text-gray-500",
    textFaint: dark ? "text-gray-500" : "text-gray-400",
    kbd: dark
      ? "border-white/15 bg-white/5 text-gray-400"
      : "border-gray-200 bg-gray-50 text-gray-500",
    fadeEdge: dark ? "from-[#070b14]" : "from-[#f6f7fb]",
    tint: (name) => TINTS[name][dark ? "dark" : "light"],
  };

  /* ------------------------------------------------ */
  /* GREETING */
  /* ------------------------------------------------ */

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const firstName = (user?.displayName || "Student").split(" ")[0];

  /* ------------------------------------------------ */
  /* TOOLS: search + category filter */
  /* ------------------------------------------------ */

  const categoryNames = [
    "All",
    ...featureSections.map((section) => section.title),
  ];

  const allItems = useMemo(() => allFeatures, []);
  const totalToolCount = allItems.length;

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const isFiltering = normalizedQuery.length > 0 || activeCategory !== "All";

  const matchedItems = useMemo(() => {
    return allItems.filter((item) => {
      const matchesCategory =
        activeCategory === "All" || item.category === activeCategory;

      const matchesQuery =
        !normalizedQuery ||
        item.title.toLowerCase().includes(normalizedQuery) ||
        item.desc.toLowerCase().includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [allItems, activeCategory, normalizedQuery]);

  // While searching/filtering, always show every match; otherwise preview.
  const filteredItems =
    showAllTools || isFiltering
      ? matchedItems
      : matchedItems.slice(0, TOOLS_PREVIEW_COUNT);

  const canToggleTools =
    !isFiltering && matchedItems.length > TOOLS_PREVIEW_COUNT;

  const clearFilters = () => {
    setSearchQuery("");
    setActiveCategory("All");
  };

  /* ------------------------------------------------ */
  /* STATS */
  /* ------------------------------------------------ */

  const stats = [
    {
      icon: BarChart3,
      label: "CGPA records",
      value: dashboard.totalRecords,
      tint: "indigo",
    },
    {
      icon: Trophy,
      label: "Best CGPA",
      value: dashboard.bestCGPA,
      tint: "emerald",
    },
    {
      icon: Activity,
      label: "Average CGPA",
      value: dashboard.avgCGPA,
      tint: "sky",
    },
    {
      icon: Sparkles,
      label: "Tools available",
      value: totalToolCount,
      tint: "violet",
    },
  ];

  /* ------------------------------------------------ */
  /* RENDER */
  /* ------------------------------------------------ */

  return (
    <div
      className={`min-h-screen px-4 md:px-8 lg:px-10 md:mt-20 ${theme.bg} motion-safe:transition-colors motion-safe:duration-300`}
    >
      <div className="px-0 sm:px-4 md:px-6 lg:px-8 py-6 md:py-10 max-w-[1280px] mx-auto">
        {/* ================================================= */}
        {/* HEADER: greeting + primary actions */}
        {/* ================================================= */}

        <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between mb-6 md:mb-8">
          <div className="min-w-0">
            <p className={`text-sm font-semibold ${theme.textSoft}`}>
              {greeting}
            </p>
            <h1 className="mt-1 text-3xl md:text-4xl font-black tracking-tight truncate">
              Welcome back, {firstName}
            </h1>
            <p className={`mt-2 text-sm max-w-xl ${theme.textSoft}`}>
              Pick up where you left off, or find a tool for your next
              assignment.
            </p>
          </div>

          <button
            type="button"
            onClick={focusSearch}
            className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm w-full md:w-72 transition hover:border-indigo-400/60 ${theme.card} ${FOCUS_RING}`}
          >
            <Search size={16} className={theme.textFaint} />
            <span className={`flex-1 ${theme.textSoft}`}>Find a tool…</span>
            <kbd
              className={`hidden md:inline-flex h-6 min-w-6 items-center justify-center rounded-md border px-1.5 text-[11px] font-semibold ${theme.kbd}`}
            >
              /
            </kbd>
          </button>
        </header>

        {/* ================================================= */}
        {/* QUICK ACTIONS */}
        {/* ================================================= */}

        <nav
          aria-label="Quick actions"
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6 md:mb-8"
        >
          {QUICK_ACTIONS.map(({ label, hint, to, icon: Icon, tint }) => (
            <Link
              key={label}
              to={to}
              className={`group flex items-center gap-3 rounded-2xl p-3.5 transition hover:border-indigo-400/60 hover:shadow-md motion-safe:hover:-translate-y-0.5 ${theme.card} ${FOCUS_RING}`}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${theme.tint(tint)}`}
              >
                <Icon size={18} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold leading-tight">
                  {label}
                </span>
                <span className={`block truncate text-xs mt-0.5 ${theme.textSoft}`}>
                  {hint}
                </span>
              </span>
            </Link>
          ))}
        </nav>

        {/* ================================================= */}
        {/* STATS */}
        {/* ================================================= */}

        <section
          aria-label="Your stats"
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 md:mb-8"
        >
          {stats.map(({ icon: Icon, label, value, tint }) => (
            <div
              key={label}
              className={`rounded-2xl p-4 flex items-center gap-3.5 ${theme.card}`}
            >
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${theme.tint(tint)}`}
              >
                <Icon size={19} />
              </span>
              <div className="min-w-0">
                {loading && label !== "Tools available" ? (
                  <div
                    className={`h-6 w-14 rounded-md motion-safe:animate-pulse ${theme.soft}`}
                  />
                ) : (
                  <p className="text-xl font-black leading-tight">{value}</p>
                )}
                <p className={`text-xs mt-0.5 truncate ${theme.textSoft}`}>
                  {label}
                </p>
              </div>
            </div>
          ))}
        </section>

        {/* ================================================= */}
        {/* DAILY CHALLENGE (the one high-emphasis banner) */}
        {/* ================================================= */}

        <DailyChallengeBanner />

        {/* ================================================= */}
        {/* EXPLORE TOOLS */}
        {/* ================================================= */}

        <section
          id="explore-tools"
          ref={toolsRef}
          className="mb-10 md:mb-12 scroll-mt-24"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-5">
            <div>
              <h2 className="text-xl md:text-2xl font-black">Explore tools</h2>
              <p className={`text-sm mt-1 ${theme.textSoft}`}>
                {totalToolCount} tools across academics, marketplace, and
                community.
              </p>
            </div>

            <Link
              to="/features"
              className={`inline-flex items-center gap-1.5 text-sm font-bold text-indigo-500 hover:text-indigo-400 transition rounded-lg ${FOCUS_RING}`}
            >
              See all features
              <ArrowRight size={15} />
            </Link>
          </div>

          {/* SEARCH */}
          <div
            className={`flex items-center gap-2.5 rounded-2xl px-4 py-3 mb-4 transition ${theme.input}`}
          >
            <Search size={17} className={theme.textFaint} />
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setSearchQuery("")}
              placeholder="Search tools, e.g. CGPA calculator, marketplace"
              className={`flex-1 min-w-0 bg-transparent text-sm outline-none ${
                dark ? "placeholder:text-gray-500" : "placeholder:text-gray-400"
              }`}
              aria-label="Search tools"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 hover:bg-red-500/10 hover:text-red-500 transition ${theme.textFaint}`}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* CATEGORY PILLS */}
          <div className="relative mb-5">
            <div
              role="tablist"
              aria-label="Tool categories"
              className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1 pr-8"
            >
              {categoryNames.map((name) => {
                const active = activeCategory === name;
                return (
                  <button
                    key={name}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveCategory(name)}
                    className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold whitespace-nowrap border transition ${FOCUS_RING} ${
                      active
                        ? "bg-indigo-500 border-indigo-500 text-white"
                        : `${theme.card} hover:border-indigo-500/50 hover:text-indigo-500`
                    }`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
            <div
              className={`pointer-events-none absolute top-0 right-0 h-full w-10 bg-gradient-to-l ${theme.fadeEdge} to-transparent`}
            />
          </div>

          {/* RESULT COUNT (only while filtering) */}
          {isFiltering && (
            <div
              className="flex items-center justify-between mb-3"
              aria-live="polite"
            >
              <p className={`text-xs font-semibold ${theme.textSoft}`}>
                {matchedItems.length}{" "}
                {matchedItems.length === 1 ? "tool" : "tools"} found
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className={`text-xs font-bold text-indigo-500 hover:text-indigo-400 transition rounded ${FOCUS_RING}`}
              >
                Clear filters
              </button>
            </div>
          )}

          {filteredItems.length === 0 ? (
            <div className={`rounded-3xl p-10 text-center ${theme.soft}`}>
              <Search className="mx-auto mb-4 opacity-40" size={36} />
              <h3 className="font-bold mb-1">
                {searchQuery
                  ? `No tools match "${searchQuery}"`
                  : "No tools in this category yet"}
              </h3>
              <p className={`text-sm mb-4 ${theme.textSoft}`}>
                Check the spelling, try a shorter keyword, or pick another
                category.
              </p>
              {isFiltering && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className={`inline-flex px-4 py-2 rounded-xl bg-indigo-500 text-white text-sm font-bold hover:bg-indigo-600 transition ${FOCUS_RING}`}
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
              {filteredItems.map((item) => (
                <ToolRow
                  key={`${item.category}-${item.title}`}
                  item={item}
                  theme={theme}
                />
              ))}
            </div>
          )}

          {canToggleTools && (
            <div className="text-center mt-5">
              <button
                type="button"
                onClick={() => setShowAllTools((v) => !v)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition hover:border-indigo-400/60 hover:text-indigo-500 ${theme.card} ${FOCUS_RING}`}
              >
                {showAllTools
                  ? "Show fewer tools"
                  : `Show all ${matchedItems.length} tools`}
                <ChevronRight
                  size={13}
                  className={`transition-transform ${
                    showAllTools ? "-rotate-90" : "rotate-90"
                  }`}
                />
              </button>
            </div>
          )}
        </section>

        {/* ================================================= */}
        {/* TRENDING + CGPA HISTORY */}
        {/* ================================================= */}

        <div className="grid lg:grid-cols-[1fr_1fr] gap-5 md:gap-6 mb-10 md:mb-12">
          {/* TRENDING */}
          <section className={`${theme.card} rounded-3xl p-5 md:p-6`}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-2xl bg-orange-500/10 flex items-center justify-center shrink-0">
                <Flame className="text-orange-500" size={20} />
              </div>
              <div>
                <h2 className="font-black text-lg">Trending now</h2>
                <p className={`text-xs ${theme.textSoft}`}>
                  Tools students are using most
                </p>
              </div>
            </div>

            <ol className="space-y-2.5">
              {allItems.slice(5, 10).map((item, i) => {
                const Icon = item.icon;
                return (
                  <li key={item.title}>
                    <Link
                      to={item.link}
                      className={`flex items-center gap-3 rounded-2xl p-3 transition hover:border-indigo-400/40 motion-safe:hover:-translate-y-0.5 ${theme.soft} ${FOCUS_RING}`}
                    >
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${theme.iconTint}`}
                        aria-label={`Rank ${i + 1}`}
                      >
                        {i + 1}
                      </span>
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${theme.iconTint}`}
                      >
                        {Icon && <Icon size={17} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm truncate">
                          {item.title}
                        </p>
                        <p className={`text-xs truncate ${theme.textSoft}`}>
                          {item.category}
                        </p>
                      </div>
                      <ChevronRight size={16} className="opacity-40 shrink-0" />
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>

          {/* CGPA HISTORY */}
          <section className={`${theme.card} rounded-3xl p-5 md:p-6`}>
            <div className="flex items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                  <HistoryIcon className="text-indigo-500" size={20} />
                </div>
                <div className="min-w-0">
                  <h2 className="font-black text-lg">CGPA history</h2>
                  <p className={`text-xs truncate ${theme.textSoft}`}>
                    Your saved academic records
                  </p>
                </div>
              </div>

              {user && !loading && records.length > 0 && (
                <Link
                  to="/CGPA"
                  className={`inline-flex h-9 items-center gap-1.5 rounded-xl bg-indigo-500 px-3 text-xs font-bold text-white hover:bg-indigo-600 transition shrink-0 ${FOCUS_RING}`}
                >
                  Add record
                  <ArrowRight size={14} />
                </Link>
              )}
            </div>

            {/* Signed out */}
            {!user && !loading && (
              <div className={`rounded-2xl p-8 text-center ${theme.soft}`}>
                <BookOpen className="mx-auto mb-3 opacity-50" size={34} />
                <h3 className="font-bold text-sm mb-1">
                  Sign in to see your records
                </h3>
                <p className={`text-xs mb-4 ${theme.textSoft}`}>
                  Your CGPA records are saved to your account.
                </p>
                <Link
                  to="/login"
                  className={`inline-flex px-4 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-bold hover:bg-indigo-600 transition ${FOCUS_RING}`}
                >
                  Sign in
                </Link>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="space-y-2.5">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`rounded-2xl h-16 motion-safe:animate-pulse ${theme.soft}`}
                  />
                ))}
              </div>
            )}

            {/* Empty */}
            {user && !loading && records.length === 0 && (
              <div className={`rounded-2xl p-8 text-center ${theme.soft}`}>
                <BookOpen className="mx-auto mb-3 opacity-50" size={34} />
                <h3 className="font-bold text-sm mb-1">No CGPA records yet</h3>
                <p className={`text-xs mb-4 ${theme.textSoft}`}>
                  Add your first semester to start tracking your progress.
                </p>
                <Link
                  to="/CGPA"
                  className={`inline-flex px-4 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-bold hover:bg-indigo-600 transition ${FOCUS_RING}`}
                >
                  Add your first record
                </Link>
              </div>
            )}

            {/* Records */}
            {user && !loading && records.length > 0 && (
              <>
                {/* Latest + trend + sparkline */}
                <div className={`rounded-2xl p-4 mb-3 ${theme.soft}`}>
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className={`text-xs ${theme.textSoft}`}>Latest CGPA</p>
                      <p className="text-3xl font-black text-indigo-500 leading-tight">
                        {dashboard.latestCGPA}
                      </p>
                      {cgpaChange !== 0 && (
                        <p
                          className={`mt-1 inline-flex items-center gap-1 text-xs font-bold ${
                            cgpaChange > 0 ? "text-emerald-500" : "text-red-500"
                          }`}
                        >
                          {cgpaChange > 0 ? (
                            <TrendingUp size={13} />
                          ) : (
                            <TrendingDown size={13} />
                          )}
                          {cgpaChange > 0 ? "+" : ""}
                          {cgpaChange.toFixed(2)} since your previous record
                        </p>
                      )}
                    </div>

                    {sparkData.length > 1 && (
                      <div
                        className="flex items-end gap-1 h-14 shrink-0"
                        role="img"
                        aria-label={`CGPA over your last ${sparkData.length} records`}
                      >
                        {sparkData.map((d, i) => (
                          <div
                            key={d.id}
                            title={`${d.value.toFixed(2)}${d.date ? ` · ${d.date}` : ""}`}
                            className={`w-2.5 rounded-t-md ${
                              i === sparkData.length - 1
                                ? "bg-indigo-500"
                                : "bg-indigo-500/30"
                            }`}
                            style={{
                              height: `${Math.max(12, (d.value / sparkMax) * 100)}%`,
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <ul className="space-y-2.5">
                  {visibleRecords.map((record) => {
                    const semCount = record.semesters?.length || 0;
                    const date = formatDate(record.createdAt);
                    return (
                      <li
                        key={record.id}
                        className={`rounded-2xl p-4 ${theme.soft}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                              <Activity size={17} />
                            </div>
                            <div className="min-w-0">
                              <p className="font-black text-indigo-500 text-lg leading-tight">
                                {record.cgpa}
                              </p>
                              <p
                                className={`text-xs truncate ${theme.textSoft}`}
                              >
                                {semCount} semester{semCount === 1 ? "" : "s"}
                                {date ? ` · ${date}` : ""}
                              </p>
                            </div>
                          </div>

                          {confirmDeleteId === record.id ? (
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleDelete(record.id)}
                                className={`rounded-lg bg-red-500 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-red-600 transition ${FOCUS_RING}`}
                              >
                                Delete
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${FOCUS_RING} ${
                                  dark
                                    ? "bg-white/10 hover:bg-white/15"
                                    : "bg-white hover:bg-gray-100"
                                }`}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(record.id)}
                              className={`w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition shrink-0 ${FOCUS_RING}`}
                              aria-label={`Delete record with CGPA ${record.cgpa}`}
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>

                {sortedRecords.length > RECORDS_PREVIEW_COUNT && (
                  <div className="text-center mt-4">
                    <button
                      type="button"
                      onClick={() => setShowAllRecords((v) => !v)}
                      className={`inline-flex items-center gap-1.5 text-xs font-bold text-indigo-500 hover:text-indigo-400 transition rounded ${FOCUS_RING}`}
                    >
                      {showAllRecords
                        ? "Show fewer"
                        : `Show all ${sortedRecords.length}`}
                      <ChevronRight
                        size={13}
                        className={`transition-transform ${
                          showAllRecords ? "-rotate-90" : "rotate-90"
                        }`}
                      />
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>

        {/* ================================================= */}
        {/* STUDENT GROUPS (quiet secondary promo) */}
        {/* ================================================= */}

        <section
          className={`relative overflow-hidden rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-5 ${theme.card}`}
        >
          <div className="min-w-0 max-w-xl">
            <h2 className="text-xl md:text-2xl font-black">
              Study better with your community
            </h2>
            <p className={`mt-2 text-sm leading-6 ${theme.textSoft}`}>
              Join student groups to share resources, ask questions, and
              collaborate on projects with people at your university.
            </p>
            <Link
              to="/community"
              className={`mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-500 px-5 text-sm font-bold text-white hover:bg-indigo-600 transition ${FOCUS_RING}`}
            >
              <Users size={16} />
              Explore groups
            </Link>
          </div>

          <img
            src={Images.group_illutration}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="hidden md:block h-44 w-auto shrink-0 object-contain"
          />
        </section>

        <div className="h-10" />
      </div>
    </div>
  );
};

/* ================================================= */
/* SUB-COMPONENTS */
/* ================================================= */

const ToolRow = ({ item, theme }) => {
  const Icon = item.icon;

  return (
    <Link
      to={item.link}
      className={`${theme.card} group flex items-start gap-3.5 rounded-2xl p-4 transition-all duration-200 hover:border-indigo-400/50 hover:shadow-md motion-safe:hover:-translate-y-0.5 ${FOCUS_RING}`}
    >
      <div
        className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center ${theme.iconTint}`}
      >
        {Icon && <Icon size={19} />}
      </div>

      <div className="min-w-0 flex-1">
        <h4 className="font-bold text-sm leading-tight">{item.title}</h4>
        <p className={`mt-1 text-xs leading-5 line-clamp-2 ${theme.textSoft}`}>
          {item.desc}
        </p>
      </div>

      <ChevronRight
        size={16}
        className="opacity-30 shrink-0 mt-1 transition group-hover:translate-x-0.5 group-hover:opacity-70"
      />
    </Link>
  );
};

const DailyChallengeBanner = () => {
  return (
    <section className="relative mb-6 md:mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-indigo-500/20">
      <div className="relative z-10 grid gap-5 px-5 py-6 sm:px-8 sm:py-8 md:grid-cols-[1fr_auto] md:items-center md:gap-10 lg:px-10">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
            <Flame size={13} />
            Daily challenge
          </span>

          <h2 className="mt-3 text-2xl font-black leading-tight sm:text-3xl max-w-xl">
            Answer today's questions, earn XP, and climb the leaderboard.
          </h2>

          <p className="mt-2 max-w-md text-sm leading-6 text-white/80">
            Quick mixed questions, fresh every day. Keep your streak going.
          </p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/challenge"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-indigo-700 transition hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-600"
            >
              Start today's challenge
              <ArrowRight size={17} />
            </Link>

            <Link
              to="/leaderboard"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 text-sm font-bold text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-600"
            >
              <Trophy size={17} />
              View leaderboard
            </Link>
          </div>
        </div>

        <img
          src={Images.challengeBannerImage}
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="hidden md:block h-48 w-auto shrink-0 object-contain lg:h-56"
        />
      </div>
    </section>
  );
};

export default Dashboard;
