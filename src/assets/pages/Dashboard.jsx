import React, { useContext, useEffect, useMemo, useState } from "react";

import {
  Activity,
  ArrowRight,
  BarChart3,
  Bot,
  BookOpen,
  ChevronRight,
  Flame,
  HistoryIcon,
  Search,
  Sparkles,
  Trash2,
  TrendingUp,
  TrendingDown,
  Trophy,
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

import PromotionAdsBanner from "../components/PromotionAdsBanner";

import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { Images } from "../data/data";
import { allFeatures, featuredFeatureItems, featureSections } from "../data/features";

// Cycle of accent gradients used for the Featured Tools shelf so each
// card reads as distinct without introducing a new brand color.
const FEATURED_GRADIENTS = [
  "from-indigo-500 to-violet-500",
  "from-sky-500 to-indigo-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
  "from-violet-500 to-fuchsia-500",
];

const Dashboard = ({ dark }) => {
  const { user } = useContext(AuthContext);

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [showAllRecords, setShowAllRecords] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");

  /* ------------------------------------------------ */
  /* FETCH CGPA RECORDS */
  /* ------------------------------------------------ */

  useEffect(() => {
    if (user) {
      fetchRecords();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchRecords = async () => {
    try {
      const q = query(
        collection(db, "cgpaTracker"),
        where("userId", "==", user.uid)
      );

      const snap = await getDocs(q);

      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setRecords(data);
    } catch (err) {
      console.log(err);
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
  /* SORT RECORDS */
  /* ------------------------------------------------ */

  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;

      return bTime - aTime;
    });
  }, [records]);

  const visibleRecords = showAllRecords
    ? sortedRecords
    : sortedRecords.slice(0, 4);

  /* ------------------------------------------------ */
  /* DASHBOARD STATS */
  /* ------------------------------------------------ */

  const dashboard = {
    totalRecords: records.length,

    bestCGPA: records.length
      ? Math.max(...records.map((r) => Number(r.cgpa) || 0)).toFixed(2)
      : "0.00",

    avgCGPA: records.length
      ? (
          records.reduce((acc, item) => acc + Number(item.cgpa || 0), 0) /
          records.length
        ).toFixed(2)
      : "0.00",

    latestCGPA: sortedRecords.length
      ? Number(sortedRecords[0]?.cgpa).toFixed(2)
      : "0.00",
  };

  // Simple trend: is the most recent record above or below the running average?
  const cgpaTrend =
    records.length > 1
      ? Number(dashboard.latestCGPA) - Number(dashboard.avgCGPA)
      : 0;

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
    border: dark ? "border-white/10" : "border-gray-200",
    fadeEdge: dark ? "from-[#070b14]" : "from-[#f6f7fb]",
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
  /* FEATURE DATA */
  /* ------------------------------------------------ */

  const categoryNames = ["All", ...featureSections.map((section) => section.title)];

  const allItems = useMemo(() => allFeatures, []);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredItems = useMemo(() => {
    const matches = allItems.filter((item) => {
      const matchesCategory =
        activeCategory === "All" || item.category === activeCategory;

      const matchesQuery =
        !normalizedQuery ||
        item.title.toLowerCase().includes(normalizedQuery) ||
        item.desc.toLowerCase().includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });

    return matches.slice(0, 6);
  }, [allItems, activeCategory, normalizedQuery]);

  const totalToolCount = allItems.length;
  const isFiltering = normalizedQuery.length > 0 || activeCategory !== "All";

  const clearFilters = () => {
    setSearchQuery("");
    setActiveCategory("All");
  };

  /* ------------------------------------------------ */
  /* STATS STRIP (real data, color-coded per stat) */
  /* ------------------------------------------------ */

  const statsStrip = [
    {
      icon: BarChart3,
      label: "CGPA Records",
      value: dashboard.totalRecords,
      tint: dark ? "bg-indigo-500/15 text-indigo-300" : "bg-indigo-50 text-indigo-600",
    },
    {
      icon: TrendingUp,
      label: "Best CGPA",
      value: dashboard.bestCGPA,
      tint: dark ? "bg-emerald-500/15 text-emerald-300" : "bg-emerald-50 text-emerald-600",
    },
    {
      icon: Activity,
      label: "Average CGPA",
      value: dashboard.avgCGPA,
      tint: dark ? "bg-sky-500/15 text-sky-300" : "bg-sky-50 text-sky-600",
    },
    {
      icon: Sparkles,
      label: "Tools Available",
      value: totalToolCount,
      tint: dark ? "bg-violet-500/15 text-violet-300" : "bg-violet-50 text-violet-600",
    },
  ];

  return (
    <div className={`min-h-screen px-4 md:px-8 lg:px-10 md:mt-20 ${theme.bg} transition-colors duration-300`}>
      <div className="px-4 md:px-6 lg:px-8 py-6 md:py-10 max-w-[1400px] mx-auto">
        {/* ================================================= */}
        {/* HERO */}
        {/* ================================================= */}

        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-center mb-10 md:mb-14">
          <div>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full mb-4 ${theme.iconTint}`}>
              <Sparkles size={12} />
              {greeting}, {firstName}
            </span>

            <h1 className="text-3xl md:text-5xl font-black leading-[1.08] tracking-tight">
              Everything you need
              <br />
              to succeed in school,
              <br />
              <span className="text-indigo-500">all in one place.</span>
            </h1>

            <p className={`mt-5 text-sm md:text-base leading-relaxed max-w-lg ${theme.textSoft}`}>
              Access every academic tool, learning resource, marketplace
              listing, and CGPA record UniHelp offers organized in a
              single dashboard built for Nigerian university students.
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-7">
              <Link
                to="/CGPA"
                className="px-5 py-3 text-sm rounded-2xl bg-indigo-500 text-white font-bold hover:bg-indigo-600 transition inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent">
                Track your CGPA
                <ArrowRight size={16} />
              </Link>
              <a
                href="#explore-tools"
                className={`px-5 py-3 text-sm rounded-2xl border font-bold transition hover:border-indigo-400/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${theme.card}`}>
                Explore Features
              </a>
            </div>

            <div className={`flex flex-wrap items-center gap-x-5 gap-y-2 mt-6 text-xs font-semibold ${theme.textSoft}`}>
              <span className="inline-flex items-center gap-1.5">
                <Activity size={13} className="text-emerald-500" />
                100% Free to Start
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Sparkles size={13} className="text-indigo-500" />
                Made for Students
              </span>
            </div>
          </div>

          {/* HERO VISUAL PANEL */}
          <div className="relative pb-6 sm:pb-0">
            <div
              className={`relative overflow-hidden rounded-[2rem] border ${ dark ? "bg-gradient-to-br from-indigo-950 via-[#0f172a] to-black border-white/10" : "bg-gradient-to-br from-indigo-50 via-white to-violet-50 border-indigo-100"}`}>
              <div className="absolute -top-10 -right-10 w-56 h-56 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-56 h-56 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
              <img
                src={Images.hero_image}
                className="aspect-[4/5] sm:aspect-[3/3] w-full object-cover object-center"
                alt="UniHelp platform preview"
              />
            </div>

            {/* Floating badges */}
            <div className={`absolute -top-3 right-2 sm:-top-5 sm:right-2 rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 border shadow-lg max-w-[62%] sm:max-w-none ${theme.card}`}>
              <p className="text-[10px] sm:text-[11px] font-semibold truncate">Welcome back,</p>
              <p className="text-sm font-black text-indigo-500 truncate">{firstName} 👋</p>
            </div>

            <div className={`absolute bottom-16 left-1 sm:bottom-6 sm:-left-3 md:-left-6 rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 border shadow-lg flex items-center gap-2.5 ${theme.card}`}>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <Flame size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black leading-tight">{dashboard.bestCGPA}</p>
                <p className={`text-[10px] whitespace-nowrap ${theme.textSoft}`}>Best CGPA</p>
              </div>
            </div>

            <Link
              to="/ai"
              className={`absolute bottom-1 right-2 sm:-bottom-5 sm:right-2 md:right-6 rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 border shadow-lg flex items-center gap-2.5 hover:-translate-y-0.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${theme.card}`}
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                <Bot size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black leading-tight whitespace-nowrap">AI Tutor</p>
                <p className={`text-[10px] whitespace-nowrap ${theme.textSoft}`}>Ask anything</p>
              </div>
            </Link>
          </div>
        </div>

        {/* ================================================= */}
        {/* ADS BANNER */}
        {/* ================================================= */}

        <div className="mb-10">
          <PromotionAdsBanner dark={dark} autoSlide={true} interval={5000} />
        </div>

        {/* ================================================= */}
        {/* STATS STRIP */}
        {/* ================================================= */}

        <section className={`grid grid-cols-2 md:grid-cols-4 rounded-3xl border mb-10 md:mb-14 overflow-hidden ${theme.card} ${theme.border}`}>
          {statsStrip.map((stat) => (
            <div key={stat.label} className="flex items-center gap-3 px-4 md:px-6 py-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${stat.tint}`}>
                <stat.icon size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-lg md:text-xl font-black leading-tight">{stat.value}</p>
                <p className={`text-xs truncate ${theme.textSoft}`}>{stat.label}</p>
              </div>
            </div>
          ))}
        </section>

        {/* ================================================= */}
        {/* FEATURED TOOLS SHELF */}
        {/* ================================================= */}

        {featuredFeatureItems?.length > 0 && (
          <section className="mb-10 md:mb-14">
            <div className="flex items-end justify-between mb-5">
              <div>
                <h2 className="text-xl md:text-2xl font-black">
                  Featured <span className="text-indigo-500">Right Now</span>
                </h2>
                <p className={`text-sm mt-1 ${theme.textSoft}`}>
                  Hand-picked tools worth trying this week.
                </p>
              </div>
            </div>

            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1 snap-x snap-mandatory">
              {featuredFeatureItems.map((item, i) => {
                const Icon = item.icon;
                const gradient = FEATURED_GRADIENTS[i % FEATURED_GRADIENTS.length];

                return (
                  <Link
                    key={`${item.title}-${i}`}
                    to={item.link}
                    className={`group relative shrink-0 w-[240px] sm:w-[260px] snap-start rounded-3xl p-5 text-white bg-gradient-to-br ${gradient} overflow-hidden transition hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white`}
                  >
                    <div className="absolute -top-8 -right-8 w-28 h-28 bg-white/15 rounded-full blur-2xl pointer-events-none" />
                    {Icon && (
                      <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center mb-8">
                        <Icon size={20} />
                      </div>
                    )}
                    <h3 className="font-black text-base leading-tight mb-1.5">{item.title}</h3>
                    <p className="text-xs leading-5 text-white/85 line-clamp-2">{item.desc}</p>
                    <div className="flex items-center gap-1 mt-4 text-xs font-bold">
                      Try it
                      <ArrowRight size={13} className="transition group-hover:translate-x-1" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ================================================= */}
        {/* EXPLORE POWERFUL TOOLS */}
        {/* ================================================= */}

        <section id="explore-tools" className="mb-10 md:mb-14 scroll-mt-20">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-5">
            <div>
              <h2 className="text-xl md:text-2xl font-black">
                Explore <span className="text-indigo-500">Powerful Tools</span>
              </h2>
              <p className={`text-sm mt-1 ${theme.textSoft}`}>
                {totalToolCount} tools across academics, marketplace, and community.
              </p>
            </div>

            <Link
              to="/features"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-500 hover:text-indigo-400 transition">
              View All Features
              <ArrowRight size={15} />
            </Link>
          </div>

          {/* SEARCH */}
          <div
            className={`flex items-center gap-2.5 rounded-2xl px-4 py-3 mb-4 transition ${theme.input}`}
          >
            <Search size={17} className={theme.textFaint} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tools, e.g. CGPA calculator, marketplace..."
              className={`flex-1 bg-transparent text-sm outline-none placeholder:${theme.textFaint}`}
              aria-label="Search tools"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 hover:bg-red-500/10 hover:text-red-500 transition ${theme.textFaint}`}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* CATEGORY PILLS with fade edges */}
          <div className="relative mb-5">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
              {categoryNames.map((name) => (
                <button
                  key={name}
                  onClick={() => setActiveCategory(name)}
                  className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold whitespace-nowrap border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    activeCategory === name
                      ? "bg-indigo-500 border-indigo-500 text-white"
                      : `${theme.card} hover:border-indigo-500/50 hover:text-indigo-500`
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
            <div className={`pointer-events-none absolute top-0 right-0 h-full w-8 bg-gradient-to-l ${theme.fadeEdge} to-transparent`} />
          </div>

          {filteredItems.length === 0 ? (
            <div className={`rounded-3xl p-10 text-center ${theme.soft}`}>
              <Search className="mx-auto mb-4 opacity-40" size={36} />
              <h3 className="font-bold mb-1">
                {searchQuery ? `No tools match "${searchQuery}"` : "No tools in this category yet"}
              </h3>
              <p className={`text-sm mb-4 ${theme.textSoft}`}>
                Try a different keyword or category.
              </p>
              {isFiltering && (
                <button
                  onClick={clearFilters}
                  className="inline-flex px-4 py-2 rounded-xl bg-indigo-500 text-white text-sm font-bold hover:bg-indigo-600 transition"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredItems.map((item) => (
                <ToolRow key={`${item.category}-${item.title}`} item={item} theme={theme} />
              ))}
            </div>
          )}
        </section>

        {/* ================================================= */}
        {/* DAILY CHALLENGE */}
        {/* ================================================= */}

        <DailyChallengeBanner />

        {/* ================================================= */}
        {/* TRENDING TOOLS + CGPA HISTORY (two column split) */}
        {/* ================================================= */}

        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
          {/* TRENDING NOW — top tools by category */}
          <section className={`${theme.card} rounded-[28px] p-5 md:p-6`}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-2xl bg-orange-500/10 flex items-center justify-center shrink-0">
                <Flame className="text-orange-500" size={20} />
              </div>
              <div>
                <h2 className="font-black text-lg">Trending Now</h2>
                <p className={`text-xs ${theme.textSoft}`}>Popular tools students use most</p>
              </div>
            </div>

            <div className="space-y-2.5">
              {allItems.slice(0, 5).map((item, i) => (
                <Link
                  key={item.title}
                  to={item.link}
                  className={`flex items-center gap-3 rounded-2xl p-3 transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${theme.soft}`}
                >
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${theme.iconTint}`}>
                    {i + 1}
                  </span>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${theme.iconTint}`}>
                    <item.icon size={17} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm truncate">{item.title}</p>
                    <p className={`text-xs truncate ${theme.textSoft}`}>{item.category}</p>
                  </div>
                  <ChevronRight size={16} className="opacity-40 shrink-0" />
                </Link>
              ))}
            </div>
          </section>

          {/* CGPA HISTORY as "Recent Activity" style panel */}
          <section className={`${theme.card} rounded-[28px] p-5 md:p-6`}>
            <div className="flex items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-red-500/10 flex items-center justify-center shrink-0">
                  <HistoryIcon className="text-red-500" size={20} />
                </div>
                <div className="min-w-0">
                  <h2 className="font-black text-lg">CGPA History</h2>
                  <p className={`text-xs truncate ${theme.textSoft}`}>Your saved academic records</p>
                </div>
              </div>

              {!loading && records.length > 0 && (
                <Link
                  to="/CGPA"
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-indigo-500 px-3 text-xs font-bold text-white hover:bg-indigo-600 transition shrink-0"
                >
                  Add New
                  <ArrowRight size={14} />
                </Link>
              )}
            </div>

            {loading && (
              <div className="space-y-2.5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`rounded-2xl p-4 ${theme.soft} animate-pulse h-16`} />
                ))}
              </div>
            )}

            {!loading && records.length === 0 && (
              <div className={`rounded-2xl p-8 text-center ${theme.soft}`}>
                <BookOpen className="mx-auto mb-3 opacity-50" size={34} />
                <h3 className="font-bold text-sm mb-1">No CGPA Records Yet</h3>
                <p className={`text-xs mb-4 ${theme.textSoft}`}>
                  Start tracking your CGPA to see your history here.
                </p>
                <Link
                  to="/CGPA"
                  className="inline-flex px-4 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-bold hover:bg-indigo-600 transition"
                >
                  Start Tracking
                </Link>
              </div>
            )}

            {!loading && records.length > 0 && (
              <>
                {cgpaTrend !== 0 && (
                  <div
                    className={`flex items-center gap-1.5 text-xs font-bold mb-3 ${
                      cgpaTrend > 0 ? "text-emerald-500" : "text-red-500"
                    }`}
                  >
                    {cgpaTrend > 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                    {cgpaTrend > 0 ? "+" : ""}
                    {cgpaTrend.toFixed(2)} vs your average
                  </div>
                )}

                <div className="space-y-2.5">
                  {visibleRecords.map((record) => (
                    <div key={record.id} className={`rounded-2xl p-4 ${theme.soft}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                            <Activity size={17} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-indigo-500 text-lg leading-tight">
                              {record.cgpa}
                            </p>
                            <p className={`text-xs truncate ${theme.textSoft}`}>
                              {record.semesters?.length || 0} semester
                              {record.semesters?.length === 1 ? "" : "s"} recorded
                            </p>
                          </div>
                        </div>

                        {confirmDeleteId === record.id ? (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleDelete(record.id)}
                              className="rounded-lg bg-red-500 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-red-600 transition"
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${dark ? "bg-white/10 hover:bg-white/15" : "bg-white hover:bg-gray-100"}`}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(record.id)}
                            className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition shrink-0"
                            aria-label="Delete record"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {sortedRecords.length > 4 && (
                  <div className="text-center mt-4">
                    <button
                      onClick={() => setShowAllRecords((v) => !v)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-500 hover:text-indigo-400 transition"
                    >
                      {showAllRecords ? "Show fewer" : `Show all ${sortedRecords.length}`}
                      <ChevronRight
                        size={13}
                        className={`transition-transform ${showAllRecords ? "-rotate-90" : "rotate-90"}`}
                      />
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>

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
      className={`${theme.card} group flex items-start gap-3.5 rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500`}
    >
      <div className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center ${theme.iconTint}`}>
        <Icon size={19} />
      </div>

      <div className="min-w-0 flex-1">
        <h4 className="font-bold text-sm leading-tight">{item.title}</h4>
        <p className={`mt-1 text-xs leading-5 ${theme.textSoft}`}>{item.desc}</p>
      </div>

      <ChevronRight
        size={16}
        className="opacity-0 shrink-0 mt-1 transition group-hover:translate-x-0.5 group-hover:opacity-60"
      />
    </Link>
  );
};

const DailyChallengeBanner = () => {
  return (
    <section className="mb-10 md:mb-14 overflow-hidden rounded-[28px] bg-gradient-to-r from-indigo-600 via-sky-600 to-emerald-500 text-white shadow-xl shadow-indigo-500/15">
      <div className="grid gap-5 px-4 py-5 sm:px-6 md:grid-cols-[1fr_auto] md:items-center lg:px-8">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 sm:h-14 sm:w-14">
            <Trophy size={24} />
          </div>

          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold sm:text-xs">
                <Flame size={13} />
                Daily Challenge
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/85 sm:text-xs">
                Fresh questions today
              </span>
            </div>

            <h2 className="max-w-3xl text-xl font-black leading-tight sm:text-2xl lg:text-3xl">
              Keep your streak alive with today's challenge.
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/85">
              Answer quick mixed questions, earn XP, and climb the leaderboard.
            </p>
          </div>
        </div>

        <Link
          to="/challenge"
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-slate-950 transition hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:w-fit"
        >
          Start Daily
          <ArrowRight size={17} />
        </Link>
      </div>
    </section>
  );
};

export default Dashboard;