import { useMemo, useState } from "react";

import {
  Atom,
  Sigma,
  FlaskConical,
  Calculator,
  TrendingUp,
  Sparkles,
  Bookmark,
  Clock3,
  ArrowRight,
  Flame,
  Brain,
  ChevronRight,
  ArrowLeft,
  Home,
} from "lucide-react";

import { motion } from "framer-motion";

import { useNavigate } from "react-router-dom";

import SearchBar from "../../components/SearchBar";
import SubjectCard from "../../components/SubjectCard";
import FormulaCard from "../../components/FormulaCard";
import FormulaCategory from "../../components/FormulaCategory";
import RecentlyViewed from "../../components/RecentlyViewed";

import { useFormulas } from "../../../hooks/useFormulas";

const FormulaHome = ({ dark }) => {
  const navigate = useNavigate();
  const { formulas, loading } = useFormulas();

  const [search, setSearch] = useState("");

  const [activeCategory, setActiveCategory] =
    useState("All");



  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(
        formulas
          .map((formula) => formula.category)
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));

    return ["All", ...uniqueCategories];
  }, [formulas]);

  // =========================
  // FILTERED FORMULAS
  // =========================

  const filtered = useMemo(() => {
    return formulas.filter((item) => {
      const matchesSearch =
        item.title
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        item.subject
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        item.category
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesCategory =
        activeCategory === "All"
          ? true
          : item.category?.toLowerCase() ===
            activeCategory.toLowerCase();

      return (
        matchesSearch && matchesCategory
      );
    });
  }, [search, activeCategory, formulas]);

  // =========================
  // SUBJECTS
  // =========================

  const subjects = useMemo(() => {
    const grouped = {};

    formulas.forEach((formula) => {
      const subject =
        formula.subject || "Unknown";

      if (!grouped[subject]) {
        grouped[subject] = {
          title: subject,
          count: 0,
        };
      }

      grouped[subject].count += 1;
    });

    return [
      {
        title: "Mathematics",
        icon: Sigma,
        count:
          grouped["Mathematics"]
            ?.count || 0,
      },

      {
        title: "Physics",
        icon: Atom,
        count:
          grouped["Physics"]?.count ||
          0,
      },

      {
        title: "Chemistry",
        icon: FlaskConical,
        count:
          grouped["Chemistry"]
            ?.count || 0,
      },

      {
        title: "Further Math",
        icon: Calculator,
        count:
          grouped["Further Mathematics"]
            ?.count || 0,
      },
    ];
  }, [formulas]);

  const formulaOfDay =
    formulas[0] || null;

  return (
    <div
      className={`
        min-h-screen
        pb-32
        md:pt-20
        px-4 sm:px-6 lg:px-10 py-6
        transition-all duration-300
        ${
          dark
            ? "bg-black"
            : "bg-zinc-50"
        }
      `}
    >
      <div className="max-w-5xl mx-auto">
        {/* =========================
            COMPACT TOP NAVIGATION
        ========================= */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-between gap-2.5 mb-5"
        >
          {/* Back & Home buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className={`h-9 px-3 rounded-xl flex items-center gap-1.5 text-xs sm:text-sm font-semibold transition border ${
                dark
                  ? "bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800"
                  : "bg-white border-zinc-200 text-zinc-800 hover:bg-zinc-100"
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={() => navigate("/")}
              className={`h-9 px-3 rounded-xl flex items-center gap-1.5 text-xs sm:text-sm font-semibold transition border ${
                dark
                  ? "bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800"
                  : "bg-white border-zinc-200 text-zinc-800 hover:bg-zinc-100"
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </button>
          </div>

          {/* Quick Action Navigation Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => navigate("/formula-hub/flashcards")}
              className="h-9 px-3 rounded-xl inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition"
            >
              <Brain className="w-4 h-4" />
              <span>Flashcards</span>
            </button>
            <button
              onClick={() => navigate("/formula-hub/subjects")}
              className={`h-9 px-3 rounded-xl inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold transition border ${
                dark
                  ? "bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800"
                  : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              <span>Subjects</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => navigate("/formula-hub/bookmarks")}
              className={`h-9 px-3 rounded-xl inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold transition border ${
                dark
                  ? "bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800"
                  : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              <Bookmark className="w-4 h-4 text-emerald-500" />
              <span className="hidden sm:inline">Bookmarks</span>
            </button>
          </div>
        </motion.div>

        {/* HERO */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border p-5 sm:p-6 mb-6 ${
            dark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200 shadow-sm"
          }`}
        >
          {/* BG EFFECT */}

          <div className="absolute top-0 right-0 w-52 h-52 bg-green-500/10 rounded-full blur-3xl" />

          <div className="absolute bottom-0 left-0 w-52 h-52 bg-indigo-500/10 rounded-full blur-3xl" />

          <div className="relative z-10">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">
              {/* LEFT */}

              <div className="flex-1">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`
                      w-12 h-12 sm:w-14 sm:h-14 rounded-2xl
                      flex items-center justify-center shrink-0
                      ${
                        dark
                          ? "bg-black"
                          : "bg-zinc-100"
                      }
                    `}
                  >
                    <TrendingUp
                      className={`
                        w-6 h-6 sm:w-7 sm:h-7
                        ${
                          dark
                            ? "text-indigo-400"
                            : "text-indigo-600"
                        }
                      `}
                    />
                  </div>

                  <div>
                    <h1
                      className={`
                        text-2xl sm:text-3xl md:text-4xl
                        font-extrabold tracking-tight
                        ${
                          dark
                            ? "text-white"
                            : "text-black"
                        }
                      `}
                    >
                      Formula Hub
                    </h1>

                    <p
                      className={`
                        mt-1 text-xs sm:text-sm
                        ${
                          dark
                            ? "text-zinc-400"
                            : "text-zinc-500"
                        }
                      `}
                    >
                      Master course formulas for university exams with AI explanations.
                    </p>
                  </div>
                </div>
              </div>

              {/* RIGHT */}

              <motion.div
                whileHover={{
                  y: -5,
                }}
                className={`
                  w-full xl:w-[350px]
                  rounded-[32px]
                  p-6 border
                  ${
                    dark
                      ? "bg-black border-zinc-800"
                      : "bg-zinc-100 border-zinc-200"
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className={`
                        text-sm
                        ${
                          dark
                            ? "text-zinc-400"
                            : "text-zinc-500"
                        }
                      `}
                    >
                      Formula of the Day
                    </p>

                    <h2
                      className={`
                        mt-2 text-2xl font-bold
                        ${
                          dark
                            ? "text-white"
                            : "text-black"
                        }
                      `}
                    >
                      {
                        formulaOfDay?.title
                      }
                    </h2>
                  </div>

                  <Sparkles className="w-7 h-7 text-yellow-500" />
                </div>

                <div
                  className={`
                    mt-6 rounded-3xl
                    p-5 overflow-auto
                    ${
                      dark
                        ? "bg-zinc-900"
                        : "bg-white"
                    }
                  `}
                >
                  <p
                    className={`
                      text-xl font-mono
                      ${
                        dark
                          ? "text-green-400"
                          : "text-black"
                      }
                    `}
                  >
                    {
                      formulaOfDay?.formula
                    }
                  </p>
                </div>

                <button
                  onClick={() =>
                    navigate(
                      `/formula-hub/${formulaOfDay?.id}`
                    )
                  }
                  className={`
                    mt-6 w-full
                    flex items-center justify-center gap-2
                    py-4 rounded-2xl
                    font-semibold transition-all duration-300
                    ${
                      dark
                        ? "bg-white text-black hover:bg-zinc-200"
                        : "bg-black text-white hover:bg-zinc-800"
                    }
                  `}
                >
                  Learn Formula

                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* SEARCH */}

        <div className="mt-8">
          <SearchBar
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            dark={dark}
          />
        </div>

        {/* SUBJECTS */}

        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2
                className={`
                  text-2xl font-bold
                  ${
                    dark
                      ? "text-white"
                      : "text-black"
                  }
                `}
              >
                Subjects
              </h2>

              <p
                className={`
                  mt-1 text-sm
                  ${
                    dark
                      ? "text-zinc-400"
                      : "text-zinc-500"
                  }
                `}
              >
                Browse formulas by
                subject
              </p>
            </div>

            <button
              onClick={() =>
                navigate(
                  "/formula-hub/subjects"
                )
              }
              className={`
                flex items-center gap-2
                text-sm font-semibold
                transition-all duration-300
                ${
                  dark
                    ? "text-zinc-300 hover:text-white"
                    : "text-zinc-600 hover:text-black"
                }
              `}
            >
              View All

              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {subjects.map(
              (subject, index) => (
                <motion.div
                  key={index}
                  initial={{
                    opacity: 0,
                    y: 20,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay:
                      index * 0.1,
                  }}
                  onClick={() =>
                    navigate(
                      `/formula-hub/subject/${encodeURIComponent(
                        subject.title
                      )}`
                    )
                  }
                  className="cursor-pointer"
                >
                  <SubjectCard
                    {...subject}
                    dark={dark}
                  />
                </motion.div>
              )
            )}
          </div>
        </div>

        {/* CATEGORIES */}

        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2
                className={`
                  text-2xl font-bold
                  ${
                    dark
                      ? "text-white"
                      : "text-black"
                  }
                `}
              >
                Categories
              </h2>

              <p
                className={`
                  mt-1 text-sm
                  ${
                    dark
                      ? "text-zinc-400"
                      : "text-zinc-500"
                  }
                `}
              >
                Filter formulas by
                category
              </p>
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {categories.map(
              (category) => (
                <FormulaCategory
                  key={category}
                  title={category}
                  active={
                    activeCategory ===
                    category
                  }
                  dark={dark}
                  onClick={() =>
                    setActiveCategory(
                      category
                    )
                  }
                />
              )
            )}
          </div>
        </div>

        {/* TRENDING */}

        <div className="mt-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Flame className="w-6 h-6 text-orange-500" />

              <div>
                <h2
                  className={`
                    text-2xl font-bold
                    ${
                      dark
                        ? "text-white"
                        : "text-black"
                    }
                  `}
                >
                  Trending Formulas
                </h2>

                <p
                  className={`
                    mt-1 text-sm
                    ${
                      dark
                        ? "text-zinc-400"
                        : "text-zinc-500"
                    }
                  `}
                >
                  Most viewed formulas
                </p>
              </div>
            </div>

            <div
              className={`
                flex items-center gap-2 text-sm
                ${
                  dark
                    ? "text-zinc-400"
                    : "text-zinc-500"
                }
              `}
            >
              <Clock3 className="w-4 h-4" />

              Updated Daily
            </div>
          </div>

          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map(
                (formula, index) => (
                  <motion.div
                    key={formula.id}
                    initial={{
                      opacity: 0,
                      y: 20,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      delay:
                        index * 0.06,
                    }}
                  >
                    <FormulaCard
                      formula={formula}
                      dark={dark}
                    />
                  </motion.div>
                )
              )}
            </div>
          ) : (
            <div
              className={`
                rounded-[32px]
                p-10 text-center
                ${
                  dark
                    ? "bg-zinc-900"
                    : "bg-white"
                }
              `}
            >
              <h3
                className={`
                  text-2xl font-bold
                  ${
                    dark
                      ? "text-white"
                      : "text-black"
                  }
                `}
              >
                No formulas found
              </h3>

              <p
                className={`
                  mt-2
                  ${
                    dark
                      ? "text-zinc-400"
                      : "text-zinc-500"
                  }
                `}
              >
                Try searching another
                keyword.
              </p>
            </div>
          )}
        </div>

        {/* RECENTLY VIEWED */}

        <div className="mt-12">
          <RecentlyViewed
            formulas={formulas.slice(
              0,
              3
            )}
            dark={dark}
          />
        </div>
      </div>
    </div>
  );
};

export default FormulaHome;
