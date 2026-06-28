import { useMemo, useState } from "react";

import { motion } from "framer-motion";

import { useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  Atom,
  Calculator,
  ChevronRight,
  FlaskConical,
  Search,
  Sigma,
  Sparkles,
  BookOpen,
  Brain,
  TrendingUp,
} from "lucide-react";

import { formulas } from "../../data/sampleFormulas";

const FormulaSubjectsPage = ({
  dark = false,
}) => {
  const navigate =
    useNavigate();

  const [search, setSearch] =
    useState("");

  // =========================================
  // SUBJECT CONFIG
  // =========================================

  const subjectIcons = {
    Mathematics: Sigma,

    Physics: Atom,

    Chemistry:
      FlaskConical,

    "Further Maths":
      Calculator,

    Engineering:
      Brain,

    Thermodynamics:
      TrendingUp,

    Statistics:
      BookOpen,
  };

  // =========================================
  // SUBJECT DATA
  // =========================================

  const subjects = useMemo(() => {
    const grouped = {};

    formulas.forEach(
      (formula) => {
        const subject =
          formula.subject ||
          "Unknown";

        if (
          !grouped[subject]
        ) {
          grouped[subject] =
            {
              title: subject,

              count: 0,
            };
        }

        grouped[
          subject
        ].count += 1;
      },
    );

    return Object.values(
      grouped,
    ).filter((item) =>
      item.title
        .toLowerCase()
        .includes(
          search.toLowerCase(),
        ),
    );
  }, [search]);

  // =========================================
  // THEME
  // =========================================

  const theme = {
    bg: dark
      ? "bg-black text-white"
      : "bg-zinc-50 text-black",

    card: dark
      ? "bg-zinc-900 border-zinc-800"
      : "bg-white border-zinc-200",

    soft: dark
      ? "bg-zinc-800"
      : "bg-zinc-100",

    text: dark
      ? "text-zinc-400"
      : "text-zinc-500",
  };

  return (
    <div
      className={`min-h-screen pb-24 px-4 sm:px-6 lg:px-10 py-6 md:pt-20 ${theme.bg}`}
    >
      <div className="max-w-7xl mx-auto">
        {/* =========================================
        HEADER
        ========================================= */}

        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className={`rounded-[35px] border p-6 sm:p-8 relative overflow-hidden ${theme.card}`}
        >
          {/* BG EFFECTS */}

          <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 blur-3xl rounded-full" />

          <div className="absolute bottom-0 left-0 w-72 h-72 bg-green-500/10 blur-3xl rounded-full" />

          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* LEFT */}

              <div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() =>
                      navigate(
                        "/formula-hub",
                      )
                    }
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${theme.soft}`}
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </button>

                  <div>
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center">
                        <Sparkles className="w-7 h-7 text-white" />
                      </div>

                      <div>
                        <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
                          Formula Subjects
                        </h1>

                        <p
                          className={`mt-2 text-sm sm:text-base ${theme.text}`}
                        >
                          Browse all
                          subjects &
                          discover
                          formulas
                          easily.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT */}

              <div
                className={`rounded-[28px] border p-5 min-w-[260px] ${theme.card}`}
              >
                <p
                  className={`text-sm ${theme.text}`}
                >
                  Total Subjects
                </p>

                <h2 className="mt-2 text-5xl font-black">
                  {
                    subjects.length
                  }
                </h2>

                <p
                  className={`mt-2 text-sm ${theme.text}`}
                >
                  Updated daily
                </p>
              </div>
            </div>

            {/* SEARCH */}

            <div className="mt-8 relative">
              <Search
                className={`absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 ${theme.text}`}
              />

              <input
                type="text"
                placeholder="Search subjects..."
                value={search}
                onChange={(
                  e,
                ) =>
                  setSearch(
                    e.target.value,
                  )
                }
                className={`w-full h-16 rounded-2xl pl-14 pr-5 outline-none border transition-all duration-300 ${
                  dark
                    ? "bg-black border-zinc-800 text-white placeholder:text-zinc-500"
                    : "bg-white border-zinc-200 text-black placeholder:text-zinc-400"
                }`}
              />
            </div>
          </div>
        </motion.div>

        {/* =========================================
        SUBJECT GRID
        ========================================= */}

        <div className="mt-10">
          {subjects.length >
          0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {subjects.map(
                (
                  subject,
                  index,
                ) => {
                  const Icon =
                    subjectIcons[
                      subject
                        .title
                    ] || BookOpen;

                  return (
                    <motion.div
                      key={
                        subject.title
                      }
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
                          index *
                          0.06,
                      }}
                      whileHover={{
                        y: -6,
                      }}
                      onClick={() =>
                        navigate(
                          `/formula-hub/subject/${encodeURIComponent(
                            subject.title,
                          )}`,
                        )
                      }
                      className={`rounded-[30px] border p-6 cursor-pointer transition-all duration-300 group ${theme.card}`}
                    >
                      {/* TOP */}

                      <div className="flex items-start justify-between">
                        <div className="w-16 h-16 rounded-3xl bg-indigo-600 flex items-center justify-center">
                          <Icon className="w-8 h-8 text-white" />
                        </div>

                        <ChevronRight
                          className={`w-6 h-6 transition-all duration-300 group-hover:translate-x-1 ${theme.text}`}
                        />
                      </div>

                      {/* CONTENT */}

                      <div className="mt-8">
                        <h2 className="text-3xl font-black">
                          {
                            subject.title
                          }
                        </h2>

                        <p
                          className={`mt-3 text-sm leading-relaxed ${theme.text}`}
                        >
                          Explore all
                          formulas,
                          equations,
                          derivations,
                          and quick
                          explanations
                          for{" "}
                          {
                            subject.title
                          }
                          .
                        </p>
                      </div>

                      {/* FOOTER */}

                      <div
                        className={`mt-8 rounded-2xl p-4 flex items-center justify-between ${theme.soft}`}
                      >
                        <div>
                          <p
                            className={`text-xs ${theme.text}`}
                          >
                            Total
                            Formulas
                          </p>

                          <h3 className="text-2xl font-black mt-1">
                            {
                              subject.count
                            }
                          </h3>
                        </div>

                        <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
                          <Sparkles className="w-6 h-6 text-green-500" />
                        </div>
                      </div>
                    </motion.div>
                  );
                },
              )}
            </div>
          ) : (
            <div
              className={`rounded-[35px] p-10 text-center ${theme.card}`}
            >
              <h2 className="text-3xl font-black">
                No Subjects Found
              </h2>

              <p
                className={`mt-3 ${theme.text}`}
              >
                Try another
                search keyword.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormulaSubjectsPage;
