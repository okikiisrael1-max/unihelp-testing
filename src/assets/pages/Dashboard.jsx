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
    } catch (err) {
      console.log(err);
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
        { title: "Task Management", desc: "Plan assignments and deadlines", icon: Clock3, color: "from-teal-500 to-emerald-600", link: "/tasks" },
        { title: "Smart Timetable", desc: "Generate a balanced weekly schedule", icon: CalendarDays, color: "from-cyan-500 to-indigo-600", link: "/smart-timetable" },
        { title: "Upload Questions", desc: "Contribute academic materials", icon: UploadCloud, color: "from-orange-500 to-red-500", link: "/uploadquestion" },
      ],
    },
    {
      title: "Learning",
      desc: "Tutorials, videos, stories, purchases, and creator tools.",
      icon: BookOpen,
      items: [
        { title: "Tutorial Marketplace", desc: "Learn from student creators", icon: Video, color: "from-green-500 to-emerald-600", link: "/tutorialmarketplace" },
        { title: "YouTube Videos", desc: "Watch educational content", icon: Youtube, color: "from-red-500 to-rose-600", link: "/tutorials" },
        { title: "My Purchases", desc: "Access bought tutorials and files", icon: Wallet, color: "from-slate-500 to-slate-700", link: "/my-purchases" },
        { title: "Tutor Dashboard", desc: "Manage your creator activity", icon: GraduationCap, color: "from-violet-500 to-purple-700", link: "/tutor-dashboard" },
        { title: "Upload Tutorial", desc: "Create and publish a tutorial", icon: BookOpen, color: "from-emerald-500 to-teal-600", link: "/create-tutorial" },
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
        { title: "Tutorial Sales", desc: "Browse paid learning resources", icon: BadgeDollarSign, color: "from-amber-500 to-orange-600", link: "/tutorialmarketplace" },
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

  return (
    <div
      className={`min-h-screen md:pt-20 ${theme.bg} transition-all duration-300`}>

      <div className="px-4 md:px-6 lg:px-8 py-5 md:py-8">

        {/* ================================================= */}
        {/* HERO SECTION */}
        {/* ================================================= */}

        <div
          className={`relative overflow-hidden rounded-4xl p-3 md:p-8 mb-8 border ${
            dark
              ? "bg-linear-to-br from-indigo-950 via-[#0f172a] to-black border-white/10"
              : "bg-linear-to-br from-indigo-600 via-violet-600 to-purple-700 border-indigo-400/20 text-white"
          }`}
        >
          <div className="absolute top-0 right-0 opacity-20">
            <Sparkles size={180} />
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">

            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-sm mb-5">
                <Star size={15} />
                UniHelp Student Dashboard
              </div>

              <h1 className="text-3xl md:text-5xl font-black leading-tight">
                Welcome back,
                <span className="block mt-1">
                  {user?.displayName ||
                    "Student"}{" "}
                  👋
                </span>
              </h1>

              <p className="mt-4 text-[12px] md:text-base text-white/80 leading-relaxed max-w-xl">
                Access all your academic tools,
                learning resources, tutorials,
                marketplace services, and CGPA
                tracking in one organized platform.
              </p>

              <div className="flex flex-wrap gap-2 mt-6">
                <Link
                  to="/questions"
                  className="px-4 py-3 text-[14px] rounded-2xl bg-white text-black font-semibold hover:scale-105 transition">
                  Start Practicing
                </Link>

                <Link
                  to="/tutorialmarketplace"
                  className="px-4 py-3 text-[14px] rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md hover:bg-white/20 transition"
                >
                  Explore Tutorials
                </Link>
              </div>
            </div>

            {/* RIGHT STATS */}
            <div className="grid grid-cols-2 gap-3 w-full lg:w-[420px]">

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
                valueColor="text-green-400"
              />

              <StatCard
                dark={dark}
                icon={Activity}
                title="Average CGPA"
                value={dashboard.avgCGPA}
                valueColor="text-cyan-400"
              />

              <StatCard
                dark={dark}
                icon={Clock3}
                title="Latest CGPA"
                value={dashboard.latestCGPA}
                valueColor="text-yellow-300"
              />
            </div>
          </div>
        </div>

        {/* ================================================= */}
        {/* ADS BANNER */}
        {/* ================================================= */}

        <div className="mb-8">
          <PromotionAdsBanner   dark={dark}   autoSlide={true} interval={5000} />
        </div>

        {/* ================================================= */}
        {/* FEATURE DIRECTORY */}
        {/* ================================================= */}

        <section className="mb-10">
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

          <div className="space-y-7">
            {featureSections.map((section) => {
              const SectionIcon = section.icon;

              return (
                <div key={section.title}>
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
          </div>

          {/* LOADING */}
          {loading && (
            <div className="py-10 text-center">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />

              <p className={theme.textSoft}>
                Loading records...
              </p>
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
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">

              {sortedRecords.map((record) => (
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

                    <button
                      onClick={() =>
                        handleDelete(record.id)
                      }
                      className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition"
                    >
                      <Trash2 size={18} />
                    </button>
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
      className={`${theme.card} group flex min-h-40 flex-col justify-between rounded-3xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-r ${item.color} text-white shadow-lg`}>
          <Icon size={24} />
        </div>

        <ArrowRight className="opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100" />
      </div>

      <div className="mt-5">
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


const StatCard = ({
  icon: Icon,
  title,
  value,
  valueColor,
  dark,
}) => {
  return (
    <div className={`rounded-3xl p-2 flex items-center gap-2 backdrop-blur-xl border ${
        dark ? "bg-white/5 border-white/10" : "bg-white/10 border-white/20"}`}>
      <div className="flex items-center justify-between ">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${ dark ? "bg-white/10" : "bg-white/20"}`}>
          <Icon size={20} />
        </div>
      </div>
      <div>
        <p className="text-[10px] text-white/70">{title}</p>
      <h2 className={`text-xl font-black mt-1 ${ valueColor || "text-white"}`}>{value}</h2>
      </div>
      
    </div>
  );
};

export default Dashboard;
