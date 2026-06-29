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

  const quickLinks = [
    {
      title: "GPA Calculator",
      desc: "Calculate semester GPA instantly",
      icon: Calculator,
      color:
        "from-indigo-500 to-violet-600",
      link: "/GPA",
    },
    {
      title: "CGPA Tracker",
      desc: "Track academic performance",
      icon: Activity,
      color:
        "from-pink-500 to-rose-500",
      link: "/CGPA",
    },

    {
      title: "Past Questions",
      desc: "Practice with exam materials",
      icon: File,
      color:
        "from-blue-500 to-cyan-500",
      link: "/questions",
    },
    {
      title: "Formula Hub",
      desc: "Find Formulas of a particular topic",
      icon: Divide,
      color:
        "from-purple-500 to-cyan-500",
      link: "/formula-hub",
    },

    {
      title: "Lecture Notes",
      desc: "Upload & access notes",
      icon: UploadCloud,
      color:
        "from-yellow-500 to-orange-500",
      link: "/lecturenotesmarketplace",
    },

    {
      title: "Tutorial Videos",
      desc: "Learn from student creators",
      icon: Video,
      color:
        "from-green-500 to-emerald-600",
      link: "/tutorialmarketplace",
    },

    {
      title: "Video Player",
      desc: "Watch educational content",
      icon: PlayCircle,
      color:
        "from-fuchsia-500 to-pink-600",
      link: "/tutorials",
    },

    {
      title: "Hostel Marketplace",
      desc: "Find hostels around campus",
      icon: Home,
      color:
        "from-purple-500 to-indigo-600",
      link: "/hostelmarketplace",
    },

    {
      title: "Student Marketplace",
      desc: "Buy & sell student items",
      icon: ShoppingBag,
      color:
        "from-emerald-500 to-green-600",
      link: "/studentmarketplace",
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
        {/* QUICK ACCESS */}
        {/* ================================================= */}

        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <GraduationCap className="text-indigo-500" />

            <div>
              <h2 className="text-2xl font-black">
                Quick Access
              </h2>

              <p
                className={`text-sm ${theme.textSoft}`}
              >
                Everything you need as a
                student.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

            {quickLinks.map((item, index) => {
              const Icon = item.icon;

              return (
                <Link
                  key={index}
                  to={item.link}
                  className={`${theme.card} group rounded-3xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl`}
                >
                  <div
                    className={`w-14 h-14 rounded-2xl bg-linear-to-r ${item.color} flex items-center justify-center text-white mb-5 shadow-lg`}
                  >
                    <Icon size={26} />
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-lg leading-tight">
                        {item.title}
                      </h3>

                      <p
                        className={`text-sm mt-2 ${theme.textSoft}`}
                      >
                        {item.desc}
                      </p>
                    </div>

                    <ArrowRight className="opacity-0 group-hover:opacity-100 transition" />
                  </div>
                </Link>
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