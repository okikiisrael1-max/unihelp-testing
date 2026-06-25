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

import { formulas } from "../../data/sampleFormulas";

const FormulaHome = ({ dark }) => {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");

  const [activeCategory, setActiveCategory] =
    useState("All");



  const categories = [
    "All",
    "Algebra",
    "Geometry",
    "Mechanics",
    "Electricity",
    "Statistics",
    "Calculus",
    "Stoichiometry",
  ];

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
          : item.category === activeCategory;

      return (
        matchesSearch && matchesCategory
      );
    });
  }, [search, activeCategory]);

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
  }, []);

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
      <div className="max-w-7xl mx-auto">
        {/* =========================
            TOP NAVIGATION
        ========================= */}

        <motion.div
          initial={{
            opacity: 0,
            y: -10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="flex flex-wrap items-center justify-between gap-4 mb-8"
        >
          {/* LEFT */}

          <div className="flex items-center gap-3">
            {/* BACK BUTTON */}

            <button
              onClick={() => navigate(-1)}
              className={`
                h-14 px-5 rounded-2xl
                flex items-center gap-3
                font-semibold transition-all duration-300
                hover:scale-[1.03]
                ${
                  dark
                    ? "bg-zinc-900 border border-zinc-800 text-white hover:bg-zinc-800"
                    : "bg-white border border-zinc-200 text-black hover:bg-zinc-100"
                }
              `}
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>

            {/* HOME BUTTON */}

            <button
              onClick={() => navigate("/")}
              className={`
                h-14 px-5 rounded-2xl
                flex items-center gap-3
                font-semibold transition-all duration-300
                hover:scale-[1.03]
                ${
                  dark
                    ? "bg-zinc-900 border border-zinc-800 text-white hover:bg-zinc-800"
                    : "bg-white border border-zinc-200 text-black hover:bg-zinc-100"
                }
              `}
            >
              <Home className="w-5 h-5" />
              Home
            </button>
          </div>

          {/* RIGHT */}

          <div
            className={`
              px-5 py-3 rounded-2xl
              flex items-center gap-3
              ${
                dark
                  ? "bg-zinc-900 border border-zinc-800"
                  : "bg-white border border-zinc-200"
              }
            `}
          >
            <Sparkles className="w-5 h-5 text-yellow-500" />

            <div>
              <p
                className={`
                  text-xs
                  ${
                    dark
                      ? "text-zinc-400"
                      : "text-zinc-500"
                  }
                `}
              >
                Formula Hub
              </p>

              <h3
                className={`
                  text-sm font-bold
                  ${
                    dark
                      ? "text-white"
                      : "text-black"
                  }
                `}
              >
                Smart Learning System
              </h3>
            </div>
          </div>
        </motion.div>

        {/* HERO */}

        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.4,
          }}
          className={`
            relative overflow-hidden
            rounded-[35px]
            border
            p-6 sm:p-8
            ${
              dark
                ? "bg-zinc-900 border-zinc-800"
                : "bg-white border-zinc-200"
            }
          `}
        >
          {/* BG EFFECT */}

          <div className="absolute top-0 right-0 w-52 h-52 bg-green-500/10 rounded-full blur-3xl" />

          <div className="absolute bottom-0 left-0 w-52 h-52 bg-indigo-500/10 rounded-full blur-3xl" />

          <div className="relative z-10">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">
              {/* LEFT */}

              <div className="flex-1">
                <div className="flex items-center gap-4">
                  <div
                    className={`
                      w-16 h-16 rounded-3xl
                      flex items-center justify-center
                      ${
                        dark
                          ? "bg-black"
                          : "bg-zinc-100"
                      }
                    `}
                  >
                    <TrendingUp
                      className={`
                        w-8 h-8
                        ${
                          dark
                            ? "text-white"
                            : "text-black"
                        }
                      `}
                    />
                  </div>

                  <div>
                    <h1
                      className={`
                        text-3xl sm:text-4xl lg:text-5xl
                        font-black tracking-tight
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
                        mt-2 text-sm sm:text-base
                        ${
                          dark
                            ? "text-zinc-400"
                            : "text-zinc-500"
                        }
                      `}
                    >
                      Master formulas for
                      JAMB & university
                      courses with AI-powered
                      explanations.
                    </p>
                  </div>
                </div>

                {/* STATS */}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
                  {/* CARD */}

                  <div
                    className={`
                      p-4 rounded-3xl
                      flex items-center gap-4
                      ${
                        dark
                          ? "bg-black"
                          : "bg-zinc-100"
                      }
                    `}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center">
                      <Flame className="w-6 h-6 text-orange-500" />
                    </div>

                    <div>
                      <h3
                        className={`
                          text-lg font-bold
                          ${
                            dark
                              ? "text-white"
                              : "text-black"
                          }
                        `}
                      >
                        120+
                      </h3>

                      <p
                        className={`
                          text-xs
                          ${
                            dark
                              ? "text-zinc-400"
                              : "text-zinc-500"
                          }
                        `}
                      >
                        Trending Formulas
                      </p>
                    </div>
                  </div>

                  {/* CARD */}

                  <div
                    className={`
                      p-4 rounded-3xl
                      flex items-center gap-4
                      ${
                        dark
                          ? "bg-black"
                          : "bg-zinc-100"
                      }
                    `}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
                      <Bookmark className="w-6 h-6 text-green-500" />
                    </div>

                    <div>
                      <h3
                        className={`
                          text-lg font-bold
                          ${
                            dark
                              ? "text-white"
                              : "text-black"
                          }
                        `}
                      >
                        Save
                      </h3>

                      <p
                        className={`
                          text-xs
                          ${
                            dark
                              ? "text-zinc-400"
                              : "text-zinc-500"
                          }
                        `}
                      >
                        Bookmark formulas
                      </p>
                    </div>
                  </div>

                  {/* CARD */}

                  <div
                    className={`
                      p-4 rounded-3xl
                      flex items-center gap-4
                      ${
                        dark
                          ? "bg-black"
                          : "bg-zinc-100"
                      }
                    `}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                      <Brain className="w-6 h-6 text-purple-500" />
                    </div>

                    <div>
                      <h3
                        className={`
                          text-lg font-bold
                          ${
                            dark
                              ? "text-white"
                              : "text-black"
                          }
                        `}
                      >
                        AI Powered
                      </h3>

                      <p
                        className={`
                          text-xs
                          ${
                            dark
                              ? "text-zinc-400"
                              : "text-zinc-500"
                          }
                        `}
                      >
                        Smart explanations
                      </p>
                    </div>
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
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
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