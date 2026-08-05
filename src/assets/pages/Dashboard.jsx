import React, {
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  BookOpen,
  Calculator,
  File,
  GraduationCap,
  HistoryIcon,
  Home,
  PlayCircle,
  ShoppingBag,
  Sparkles,
  Trash2,
  TrendingUp,
  UploadCloud,
  Video,
  BarChart3,
  Clock3,
  ArrowRight,
  Star,
  Divide,
  CalendarDays,
  MessageCircle,
  Newspaper,
  Bell,
  Settings,
  Rocket,
  RadioTower,
  Wallet,
  Youtube,
  BadgeDollarSign,
  HelpCircle,
  Info,
  PhoneCall,
  FileWarning,
  Library,
  Bookmark,
  ComputerIcon,
  Trophy,
  Flame,
  Search,
  X,
  ChevronRight,
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

import AdsBanner from "../components/AdsBanner";
import DonationPopupSystem from "../components/DonationPopup";

import { Link } from "react-router-dom";
import PromotionAdsBanner, {demoAds} from "../components/PromotionAdsBanner";
import { toast } from "react-toastify";

const Dashboard = ({ dark }) => {
  const { user } = useContext(AuthContext);

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [showAllRecords, setShowAllRecords] = useState(false);

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

      setRecords((prev) =>
        prev.filter((item) => item.id !== id)
      );
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
    : sortedRecords.slice(0, 6);

  /* ------------------------------------------------ */
  /* DASHBOARD STATS */
  /* ------------------------------------------------ */

  const dashboard = {
    totalRecords: records.length,

    bestCGPA: records.length
      ? Math.max(
          ...records.map((r) => Number(r.cgpa) || 0)
        ).toFixed(2)
      : "0.00",

    avgCGPA: records.length
      ? (
          records.reduce(
            (acc, item) =>
              acc + Number(item.cgpa || 0),
            0
          ) / records.length
        ).toFixed(2)
      : "0.00",

    latestCGPA: sortedRecords.length
      ? Number(sortedRecords[0]?.cgpa).toFixed(2)
      : "0.00",
  };

  const theme = {
    bg: dark
      ? "bg-[#070b14] text-white"
      : "bg-[#f5f7fb] text-gray-900",

    card: dark
      ? "bg-white/5 border border-white/10"
      : "bg-white border border-gray-200 shadow-sm",

    soft: dark
      ? "bg-white/5"
      : "bg-gray-100",

    textSoft: dark
      ? "text-gray-400"
      : "text-gray-500",
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

  const featureSections = [
    {
      title: "Academic Tools",
      desc: "Calculators, records, tasks, notes, and study planning.",
      icon: GraduationCap,
      items: [
        { title: "GPA Calculator", desc: "Calculate semester GPA instantly", icon: Calculator, color: "from-indigo-500 to-violet-600", link: "/GPA" },
        { title: "CGPA Tracker", desc: "Track academic performance", icon: Activity, color: "from-pink-500 to-rose-500", link: "/CGPA" },
        { title: "Past Questions", desc: "Practice with exam materials", icon: File, color: "from-blue-500 to-cyan-500", link: "/questions" },
        { title: "Lecture Notes", desc: "Upload and access notes", icon: UploadCloud, color: "from-yellow-500 to-orange-500", link: "/lecturenotesmarketplace" },
        { title: "CBT Practice", desc: "Practice with exam materials", icon: ComputerIcon, color: "from-blue-500 to-cyan-500", link: "/cbt-practice" },
        { title: "Task Management", desc: "Plan assignments and deadlines", icon: Clock3, color: "from-teal-500 to-emerald-600", link: "/tasks" },
        { title: "Smart Timetable", desc: "Generate a balanced weekly schedule", icon: CalendarDays, color: "from-cyan-500 to-indigo-600", link: "/smart-timetable" },
        { title: "Upload Questions", desc: "Contribute academic materials", icon: UploadCloud, color: "from-orange-500 to-red-500", link: "/uploadquestion" },
        { title: "Stories", desc: "Read and create student stories", icon: PlayCircle, color: "from-fuchsia-500 to-pink-600", link: "/stories" },
      ],
    },
    {
      title: "Marketplace",
      desc: "Student services, hostels, products, and saved listings.",
      icon: ShoppingBag,
      items: [
        { title: "Hostel Marketplace", desc: "Find hostels around campus", icon: Home, color: "from-purple-500 to-indigo-600", link: "/hostelmarketplace" },
        { title: "Student Marketplace", desc: "Buy and sell student items", icon: ShoppingBag, color: "from-emerald-500 to-green-600", link: "/studentmarketplace" },
        { title: "My Hostels", desc: "Manage uploaded hostel listings", icon: Home, color: "from-sky-500 to-blue-700", link: "/myhostels" },
      ],
    },
    {
      title: "Smart Features",
      desc: "AI, community, alerts, and discovery tools.",
      icon: Sparkles,
      items: [
        { title: "AI Assistance", desc: "Ask for guided academic help", icon: Sparkles, color: "from-indigo-500 to-purple-600", link: "/ai" },
        { title: "SmartFeeds", desc: "Catch useful education updates", icon: Newspaper, color: "from-blue-500 to-sky-600", link: "/newsfeed" },
        { title: "Groups", desc: "Join student communities", icon: MessageCircle, color: "from-emerald-500 to-teal-600", link: "/community" },
        { title: "Messenger", desc: "Chat with classmates directly", icon: MessageCircle, color: "from-cyan-500 to-blue-600", link: "/messages" },
        { title: "Notifications", desc: "See alerts and requests", icon: Bell, color: "from-amber-500 to-yellow-600", link: "/notifications" },
        { title: "Privacy Settings", desc: "Control messaging preferences", icon: Settings, color: "from-slate-500 to-gray-700", link: "/community-settings" },
        { title: "Coming Soon", desc: "Preview upcoming UniHelp tools", icon: Rocket, color: "from-violet-500 to-fuchsia-600", link: "/coming-soon" },
        { title: "Announcements", desc: "Read campus and app updates", icon: RadioTower, color: "from-rose-500 to-red-600", link: "/announcements" },
        { title: "Premium", desc: "Unlock premium student features", icon: Star, color: "from-yellow-500 to-amber-600", link: "/premium" },
      ],
    },
    {
      title: "Formula Hub",
      desc: "Formulas, subjects, bookmarks, and quick references.",
      icon: Library,
      items: [
        { title: "Formula Hub", desc: "Find formulas by topic", icon: Divide, color: "from-purple-500 to-cyan-500", link: "/formula-hub" },
        { title: "Formula Subjects", desc: "Browse formulas by subject", icon: Library, color: "from-indigo-500 to-sky-600", link: "/formula-hub/subjects" },
        { title: "Bookmarks", desc: "Open saved formulas quickly", icon: Bookmark, color: "from-emerald-500 to-green-700", link: "/formula-hub/bookmarks" },
      ],
    },
    {
      title: "Support",
      desc: "Help pages, policies, contact, and issue reports.",
      icon: HelpCircle,
      items: [
        { title: "FAQ", desc: "Answers to common questions", icon: HelpCircle, color: "from-indigo-500 to-blue-600", link: "/faq" },
        { title: "Help Center", desc: "Find guidance for UniHelp", icon: Info, color: "from-sky-500 to-cyan-600", link: "/help-center" },
        { title: "Contact", desc: "Reach the UniHelp team", icon: PhoneCall, color: "from-emerald-500 to-teal-700", link: "/contact" },
        { title: "Report", desc: "Report safety or platform issues", icon: FileWarning, color: "from-red-500 to-rose-700", link: "/report" },
        { title: "About UniHelp", desc: "Learn what UniHelp offers", icon: Info, color: "from-violet-500 to-purple-700", link: "/about" },
      ],
    },
  ];

  /* ------------------------------------------------ */
  /* SEARCH FILTERING */
  /* ------------------------------------------------ */

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredSections = useMemo(() => {
    if (!normalizedQuery) return featureSections;

    return featureSections
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            item.title.toLowerCase().includes(normalizedQuery) ||
            item.desc.toLowerCase().includes(normalizedQuery)
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [normalizedQuery]);

  const totalToolCount = featureSections.reduce(
    (acc, s) => acc + s.items.length,
    0
  );

  const scrollToSection = (title) => {
    const el = document.getElementById(
      `section-${title.replace(/\s+/g, "-").toLowerCase()}`
    );
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div
      className={`min-h-screen md:pt-20 ${theme.bg} transition-all duration-300`}>

      <div className="px-4 md:px-6 lg:px-8 py-5 md:py-8">

        {/* ================================================= */}
        {/* HERO SECTION */}
        {/* ================================================= */}

        <div
          className={`relative overflow-hidden rounded-4xl p-4 md:p-8 mb-6 border ${
            dark
              ? "bg-linear-to-br from-indigo-950 via-[#0f172a] to-black border-white/10"
              : "bg-linear-to-br from-indigo-500 via-violet-900 to-purple-700 border-indigo-400/20 text-white"
          }`}>
          <div className="absolute top-0 right-0 opacity-20 pointer-events-none">
            <Sparkles size={180} />
          </div>
          <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">

            <div className="max-w-2xl">

              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/70 bg-white/10 px-3 py-1 rounded-full mb-3">
                <Sparkles size={12} />
                {greeting}
              </span>

              <h1 className="text-2xl md:text-4xl font-bold leading-tight">
                Welcome back,
                <span className="block mt-1">
                  {user?.displayName ||
                    "Student"}{" "}
                  👋
                </span>
              </h1>

              <p className="mt-4 text-[12px] md:text-base text-white/80 leading-relaxed max-w-xl">
                Access all your academic tools,
                learning resources,
                marketplace services, and CGPA
                tracking in one organized platform.
              </p>

              <div className="flex flex-wrap gap-2 mt-6">
                <Link
                  to="/questions"
                  className="px-4 py-3 text-[14px] rounded-2xl bg-white text-black font-semibold hover:scale-105 transition inline-flex items-center gap-2"
                >
                  Start Practicing
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/CGPA"
                  className="px-4 py-3 text-[14px] rounded-2xl bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/20 transition"
                >
                  Track CGPA
                </Link>
              </div>
            </div>

            {/* RIGHT STATS */}
            <div className="grid grid-cols-2 gap-3 w-full lg:w-[440px]">

              <StatCard
                dark={dark}
                icon={BarChart3}
                title="Total Records"
                value={dashboard.totalRecords}
              />

              <StatCard
                dark={dark}
                icon={TrendingUp}
                title="Best CGPA"
                value={dashboard.bestCGPA}
                valueColor="text-emerald-300"
              />

              <StatCard
                dark={dark}
                icon={Activity}
                title="Average CGPA"
                value={dashboard.avgCGPA}
                valueColor="text-cyan-300"
              />

              <StatCard
                dark={dark}
                icon={Clock3}
                title="Latest CGPA"
                value={dashboard.latestCGPA}
                valueColor="text-amber-300"
              />
            </div>
          </div>
        </div>

        {/* ================================================= */}
        {/* ADS BANNER */}
        {/* ================================================= */}

        <div className="mb-6">
          <PromotionAdsBanner   dark={dark}   autoSlide={true} interval={5000} />
        </div>

        {/* ================================================= */}
        {/* SEARCH + QUICK JUMP NAV */}
        {/* ================================================= */}

        <div className={`sticky top-0 z-20 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 py-3 mb-6 backdrop-blur-xl ${dark ? "bg-[#070b14]/80" : "bg-[#f5f7fb]/80"}`}>
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className={`relative flex-1 md:max-w-sm rounded-2xl border ${theme.card}`}>
              <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${totalToolCount} tools...`}
                className="w-full h-12 pl-11 pr-9 rounded-2xl bg-transparent outline-none text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition"
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {!normalizedQuery && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
                {featureSections.map((section) => (
                  <button
                    key={section.title}
                    onClick={() => scrollToSection(section.title)}
                    className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold whitespace-nowrap border transition ${theme.card} hover:border-indigo-500/50 hover:text-indigo-500`}
                  >
                    {section.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ================================================= */}
        {/* FEATURE DIRECTORY */}
        {/* ================================================= */}

        <section className="mb-10">
          {!normalizedQuery && (
            <>
              <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
                    <Sparkles size={22} />
                  </div>

                  <div>
                    <h2 className="text-2xl font-black">
                      All UniHelp Features
                    </h2>

                    <p className={`text-sm ${theme.textSoft}`}>
                      Organized tools for learning, campus life, community, and support.
                    </p>
                  </div>
                </div>

                <Link
                  to="/coming-soon"
                  className={`inline-flex h-11 items-center gap-2 rounded-2xl border px-4 text-sm font-bold ${theme.card}`}
                >
                  <Rocket size={17} />
                  View Upcoming
                </Link>
              </div>

              <DailyChallengeBanner dark={dark} />
            </>
          )}

          {normalizedQuery && filteredSections.length === 0 && (
            <div className={`rounded-3xl p-10 text-center ${theme.soft}`}>
              <Search className="mx-auto mb-4 opacity-40" size={40} />
              <h3 className="font-bold text-lg mb-1">No tools match "{searchQuery}"</h3>
              <p className={`text-sm ${theme.textSoft}`}>Try a different keyword or clear the search.</p>
            </div>
          )}

          <div className="space-y-7">
            {(normalizedQuery ? filteredSections : featureSections).map((section) => {
              const SectionIcon = section.icon;
              const sectionId = `section-${section.title.replace(/\s+/g, "-").toLowerCase()}`;

              return (
                <div key={section.title} id={sectionId} className="scroll-mt-24">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${theme.card} text-indigo-500`}>
                        <SectionIcon size={20} />
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-xl font-black">
                          {section.title}
                        </h3>

                        <p className={`mt-1 text-sm ${theme.textSoft}`}>
                          {section.desc}
                        </p>
                      </div>
                    </div>

                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${theme.soft} ${theme.textSoft}`}>
                      {section.items.length} tools
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {section.items.map((item) => (
                      <FeatureCard
                        key={`${section.title}-${item.title}`}
                        item={item}
                        theme={theme}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ================================================= */}
        {/* CGPA HISTORY */}
        {/* ================================================= */}

        <section
          className={`${theme.card} rounded-[30px] p-5 md:p-7`}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
                <HistoryIcon className="text-red-500" />
              </div>

              <div>
                <h2 className="font-black text-2xl">
                  CGPA History
                </h2>

                <p
                  className={`text-sm ${theme.textSoft}`}
                >
                  View and manage your saved
                  academic records.
                </p>
              </div>
            </div>

            {!loading && records.length > 0 && (
              <Link
                to="/CGPA"
                className="inline-flex h-11 items-center gap-2 rounded-2xl bg-indigo-500 px-4 text-sm font-bold text-white hover:bg-indigo-600 transition"
              >
                Add New Record
                <ArrowRight size={16} />
              </Link>
            )}
          </div>

          {/* LOADING */}
          {loading && (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`rounded-3xl p-5 ${theme.soft} animate-pulse`}>
                  <div className="h-4 w-20 rounded bg-current opacity-10 mb-3" />
                  <div className="h-8 w-24 rounded bg-current opacity-10 mb-5" />
                  <div className="h-14 rounded-2xl bg-current opacity-5 mb-2" />
                  <div className="h-14 rounded-2xl bg-current opacity-5" />
                </div>
              ))}
            </div>
          )}

          {/* EMPTY */}
          {!loading && records.length === 0 && (
            <div
              className={`rounded-3xl p-10 text-center ${theme.soft}`}
            >
              <BookOpen
                className="mx-auto mb-4 opacity-50"
                size={55}
              />

              <h3 className="font-bold text-xl mb-2">
                No CGPA Records Yet
              </h3>

              <p
                className={`text-sm ${theme.textSoft}`}
              >
                Start tracking your CGPA to see
                your academic history here.
              </p>

              <Link
                to="/CGPA"
                className="inline-flex mt-5 px-5 py-3 rounded-2xl bg-indigo-600 text-white font-semibold hover:scale-105 transition"
              >
                Start Tracking
              </Link>
            </div>
          )}

          {/* RECORDS */}
          {!loading && records.length > 0 && (
            <>
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">

                {visibleRecords.map((record) => (
                  <div
                    key={record.id}
                    className={`rounded-3xl p-5 transition-all hover:-translate-y-1 ${theme.soft}`}
                  >
                    <div className="flex items-start justify-between mb-4">

                      <div>
                        <p
                          className={`text-sm ${theme.textSoft}`}
                        >
                          Current CGPA
                        </p>

                        <h2 className="text-3xl font-black text-indigo-500">
                          {record.cgpa}
                        </h2>
                      </div>

                      {confirmDeleteId === record.id ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleDelete(record.id)}
                            className="rounded-xl bg-red-500 px-2.5 py-2 text-xs font-bold text-white hover:bg-red-600 transition"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className={`rounded-xl px-2.5 py-2 text-xs font-bold transition ${dark ? "bg-white/10 hover:bg-white/15" : "bg-white hover:bg-gray-100"}`}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(record.id)}
                          className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition"
                          aria-label="Delete record"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">

                      {record.semesters?.map(
                        (semester, index) => (
                          <div
                            key={index}
                            className={`rounded-2xl p-3 flex items-center justify-between ${
                              dark
                                ? "bg-black/20"
                                : "bg-white"
                            }`}
                          >
                            <div>
                              <h4 className="font-semibold text-sm">
                                {semester.name}
                              </h4>

                              <p
                                className={`text-xs ${theme.textSoft}`}
                              >
                                {semester.units} Units
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="font-black text-indigo-500">
                                {semester.gpa}
                              </p>

                              <p
                                className={`text-xs ${theme.textSoft}`}
                              >
                                GPA
                              </p>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {sortedRecords.length > 6 && (
                <div className="text-center mt-6">
                  <button
                    onClick={() => setShowAllRecords((v) => !v)}
                    className={`inline-flex items-center gap-1.5 text-sm font-bold text-indigo-500 hover:text-indigo-400 transition`}
                  >
                    {showAllRecords
                      ? "Show fewer records"
                      : `Show all ${sortedRecords.length} records`}
                    <ChevronRight
                      size={15}
                      className={`transition-transform ${showAllRecords ? "-rotate-90" : "rotate-90"}`}
                    />
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        <div className="h-10" />
      </div>
    </div>
  );
};


const FeatureCard = ({ item, theme }) => {
  const Icon = item.icon;

  return (
    <Link
      to={item.link}
      className={`${theme.card} group relative flex min-h-40 flex-col justify-between overflow-hidden rounded-3xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl`}
    >
      <div
        className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-linear-to-br ${item.color} opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-20`}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-r ${item.color} text-white shadow-lg`}>
          <Icon size={24} />
        </div>

        <ArrowRight size={18} className="opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100" />
      </div>

      <div className="relative mt-5">
        <h4 className="text-lg font-black leading-tight">
          {item.title}
        </h4>

        <p className={`mt-2 text-sm leading-6 ${theme.textSoft}`}>
          {item.desc}
        </p>
      </div>
    </Link>
  );
};

const DailyChallengeBanner = () => {
  return (
    <section className="mb-8 overflow-hidden rounded-[28px] bg-gradient-to-r from-indigo-600 via-sky-600 to-emerald-500 text-white shadow-xl shadow-indigo-500/15">
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

            <div className="mt-4 grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
              {["8 Questions", "XP Reward", "Streak Boost"].map((item) => (
                <span key={item} className="rounded-xl bg-white/10 px-3 py-2 text-center text-[11px] font-bold text-white/90 sm:text-left sm:text-xs">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        <Link
          to="/challenge"
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-slate-950 transition hover:scale-[1.02] md:w-fit"
        >
          Start Daily
          <ArrowRight size={17} />
        </Link>
      </div>
    </section>
  );
};


const StatCard = ({
  icon: Icon,
  title,
  value,
  valueColor,
  dark,
}) => {
  return (
    <div className={`rounded-2xl p-3.5 flex items-center gap-3 backdrop-blur-xl border transition-all hover:-translate-y-0.5 ${
        dark ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-white/10 border-white/20 hover:bg-white/15"}`}>
      <div className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center ${ dark ? "bg-white/10" : "bg-white/20"}`}>
        <Icon size={19} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-white/70 truncate">{title}</p>
        <h2 className={`text-xl font-black mt-0.5 leading-none ${ valueColor || "text-white"}`}>{value}</h2>
      </div>
    </div>
  );
};

export default Dashboard;