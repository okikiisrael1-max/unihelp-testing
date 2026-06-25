import {
  useMemo,
  useState,
  useEffect,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  BookOpen,
  Search,
  Sigma,
  Calculator,
  ArrowRight,
  X,
  ArrowLeft,
} from "lucide-react";

import EmptyState from "../../components/EmptyState";

import { formulas } from "../../data/sampleFormulas";

const SubjectsPage = ({
  dark,
}) => {

  const navigate = useNavigate();

  const [search, setSearch] =
    useState("");

  const [
    selectedSubject,
    setSelectedSubject,
  ] = useState(null);
  const [query, setQuery] = useState('')
  const filtered =
  selectedSubject?.formulas.filter((formula) =>
    formula.title
      .toLowerCase()
      .includes(query.toLowerCase())
  ) || [];

  useEffect(() => {

    if (selectedSubject) {
      document.body.style.overflow =
        "hidden";
    } else {
      document.body.style.overflow =
        "auto";
    }

    return () => {
      document.body.style.overflow =
        "auto";
    };

  }, [selectedSubject]);

  /**
   * =========================
   * SUBJECTS
   * =========================
   */

  const subjects = useMemo(() => {

    const grouped = {};

    formulas.forEach((formula) => {

      const subject =
        formula.subject?.trim() ||
        "Unknown";

      if (!grouped[subject]) {

        grouped[subject] = {
          name: subject,
          count: 0,
          formulas: [],
        };
      }

      grouped[subject].count += 1;

      grouped[subject].formulas.push(
        formula
      );
    });

    return Object.values(grouped)

      .filter((subject) =>
        subject.name
          .toLowerCase()
          .includes(
            search.toLowerCase()
          )
      )

      .sort((a, b) =>
        a.name.localeCompare(
          b.name
        )
      );

  }, [search]);

  /**
   * =========================
   * EMPTY STATE
   * =========================
   */

  if (!subjects.length) {

    return (
      <EmptyState
        dark={dark}
        title="No Subjects Found"
        description="Try searching for another subject."
      />
    );
  }

  return (
    <>
      {/* PAGE */}
      <div
        className={`
          min-h-screen md:pt-20
          px-4 sm:px-6 lg:px-10 py-6
          transition-all duration-300
          ${dark
            ? "bg-black"
            : "bg-zinc-50"
          }
        `}
      >
        <div className="max-w-7xl mx-auto">

          {/* TOP NAVIGATION */}
          <div className="mb-8">

            <button
              onClick={() =>
                navigate(-1)
              }
              className={`
                flex items-center gap-2
                px-5 py-3 rounded-2xl
                transition-all duration-300
                ${dark
                  ? "bg-zinc-900 text-white hover:bg-zinc-800"
                  : "bg-white text-black border border-zinc-200 hover:bg-zinc-100"
                }
              `}
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
          </div>

          {/* HEADER */}
          <div
            className="
              flex flex-col
              lg:flex-row
              lg:items-center
              lg:justify-between
              gap-5 mb-10
            "
          >

            {/* LEFT */}
            <div className="flex items-center gap-4">

              <div
                className={`
                  w-16 h-16 rounded-3xl
                  flex items-center justify-center
                  ${dark
                    ? "bg-zinc-900"
                    : "bg-white border border-zinc-200"
                  }
                `}
              >

                <BookOpen
                  className={`
                    w-8 h-8
                    ${dark
                      ? "text-white"
                      : "text-black"
                    }
                  `}
                />
              </div>

              <div>

                <h1
                  className={`
                    text-3xl sm:text-4xl
                    font-bold
                    ${dark
                      ? "text-white"
                      : "text-black"
                    }
                  `}
                >
                  Subjects
                </h1>

                <p
                  className={`
                    mt-1 text-sm
                    ${dark
                      ? "text-zinc-400"
                      : "text-zinc-500"
                    }
                  `}
                >
                  Browse formulas by subject
                </p>

                <p
                  className={`
                    mt-2 text-xs
                    ${dark
                      ? "text-zinc-500"
                      : "text-zinc-400"
                    }
                  `}
                >
                  {subjects.length} subject
                  {subjects.length > 1
                    ? "s"
                    : ""}
                  {" "}available
                </p>
              </div>
            </div>

            {/* SEARCH */}
            <div
              className={`
                flex items-center gap-3
                px-4 py-3 rounded-2xl
                w-full lg:w-[350px]
                ${dark
                  ? "bg-zinc-900"
                  : "bg-white border border-zinc-200"
                }
              `}
            >

              <Search
                className={`
                  w-5 h-5
                  ${dark
                    ? "text-zinc-400"
                    : "text-zinc-500"
                  }
                `}
              />

              <input
                type="text"
                placeholder="Search subjects..."
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                className={`
                  w-full bg-transparent
                  outline-none
                  ${dark
                    ? "text-white placeholder:text-zinc-500"
                    : "text-black placeholder:text-zinc-400"
                  }
                `}
              />
            </div>
          </div>

          {/* SUBJECT GRID */}
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">

            {subjects.map(
              (subject) => (

                <div
                  key={subject.name}

                  onClick={() =>
                    setSelectedSubject(
                      subject
                    )
                  }

                  className={`
                    group rounded-3xl
                    p-6 cursor-pointer
                    border transition-all
                    duration-300
                    hover:-translate-y-1
                    hover:shadow-2xl
                    active:scale-[0.98]
                    ${dark
                      ? "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                      : "bg-white border-zinc-200 hover:border-zinc-300"
                    }
                  `}
                >

                  {/* TOP */}
                  <div className="flex items-start justify-between">

                    <div
                      className={`
                        w-14 h-14 rounded-2xl
                        flex items-center justify-center
                        transition-all duration-300
                        ${dark
                          ? "bg-zinc-800 group-hover:bg-zinc-700"
                          : "bg-zinc-100 group-hover:bg-zinc-200"
                        }
                      `}
                    >

                      <Sigma
                        className={`
                          w-7 h-7
                          ${dark
                            ? "text-white"
                            : "text-black"
                          }
                        `}
                      />
                    </div>

                    <ArrowRight
                      className={`
                        w-5 h-5
                        transition-all duration-300
                        group-hover:translate-x-1
                        ${dark
                          ? "text-zinc-500"
                          : "text-zinc-400"
                        }
                      `}
                    />
                  </div>

                  {/* CONTENT */}
                  <div className="mt-6">

                    <h2
                      className={`
                        text-xl font-semibold capitalize
                        ${dark
                          ? "text-white"
                          : "text-black"
                        }
                      `}
                    >
                      {subject.name}
                    </h2>

                    <p
                      className={`
                        mt-2 text-sm
                        ${dark
                          ? "text-zinc-400"
                          : "text-zinc-500"
                        }
                      `}
                    >
                      {subject.count} formula
                      {subject.count > 1
                        ? "s"
                        : ""}
                      {" "}available
                    </p>
                  </div>

                  {/* PREVIEW */}
                  <div
                    className={`
                      mt-5 p-4 rounded-2xl
                      ${dark
                        ? "bg-black"
                        : "bg-zinc-100"
                      }
                    `}
                  >

                    <div className="space-y-2">

                      {subject.formulas
                        .slice(0, 3)
                        .map(
                          (
                            formula
                          ) => (

                            <p
                              key={
                                formula.id
                              }
                              className={`
                                text-sm truncate
                                ${dark
                                  ? "text-zinc-300"
                                  : "text-zinc-700"
                                }
                              `}
                            >
                              •{" "}
                              {
                                formula.title
                              }
                            </p>
                          )
                        )}
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* MODAL */}
      {selectedSubject && (

        <div
          className="
            fixed inset-0 z-50
            flex items-center justify-center
            bg-black/70 backdrop-blur-sm
            px-4
          "
        >

          {/* MODAL CARD */}
          <div
            className={`
              relative w-full max-w-2xl
              rounded-[32px]
              max-h-[90vh]
              overflow-hidden
              animate-[fadeIn_.3s_ease]
              ${dark
                ? "bg-zinc-950 border border-zinc-800"
                : "bg-white border border-zinc-200"
              }
            `}
          >

            {/* HEADER */}
            <div
              className={`
                sticky top-0 z-10
                px-6 py-5 border-b
                flex items-center justify-between
                ${dark
                  ? "bg-zinc-950 border-zinc-800"
                  : "bg-white border-zinc-200"
                }
              `}
            >

              <div className="flex items-center gap-4">

                <button
                  onClick={() =>
                    setSelectedSubject(
                      null
                    )
                  }
                  className={`
                    w-12 h-12 rounded-2xl
                    flex items-center justify-center
                    transition-all duration-300
                    ${dark
                      ? "bg-zinc-900 hover:bg-zinc-800"
                      : "bg-zinc-100 hover:bg-zinc-200"
                    }
                  `}
                >
                  <ArrowLeft
                    className={`
                      w-5 h-5
                      ${dark
                        ? "text-white"
                        : "text-black"
                      }
                    `}
                  />
                </button>

                <div
                  className={`
                    w-14 h-14 rounded-2xl
                    flex items-center justify-center
                    ${dark
                      ? "bg-zinc-900"
                      : "bg-zinc-100"
                    }
                  `}
                >

                  <Sigma
                    className={`
                      w-7 h-7
                      ${dark
                        ? "text-white"
                        : "text-black"
                      }
                    `}
                  />
                </div>

                <div>

                  <h2
                    className={`
                      text-2xl font-bold capitalize
                      ${dark
                        ? "text-white"
                        : "text-black"
                      }
                    `}
                  >
                    {
                      selectedSubject.name
                    }
                  </h2>

                  <p
                    className={`
                      mt-1 text-sm
                      ${dark
                        ? "text-zinc-400"
                        : "text-zinc-500"
                      }
                    `}
                  >
                    {
                      selectedSubject
                        .formulas
                        .length
                    }{" "}
                    formulas available
                  </p>
                </div>
              </div>

              {/* CLOSE */}
              <button
                onClick={() =>
                  setSelectedSubject(
                    null
                  )
                }
                className={`
                  w-12 h-12 rounded-2xl
                  flex items-center justify-center
                  transition-all duration-300
                  ${dark
                    ? "bg-zinc-900 hover:bg-zinc-800"
                    : "bg-zinc-100 hover:bg-zinc-200"
                  }
                `}
              >

                <X
                  className={`
                    w-5 h-5
                    ${dark
                      ? "text-white"
                      : "text-black"
                    }
                  `}
                />
              </button>
            </div>
            <div
              className={`
                flex items-center gap-3
                px-4 py-3 mx-6 mt-4
                rounded-2xl border
                ${dark
                  ? "bg-zinc-900 border-zinc-800"
                  : "bg-zinc-50 border-zinc-200"
                }
              `}
            >
              <Search
                className={`w-5 h-5 ${
                  dark
                    ? "text-zinc-400"
                    : "text-zinc-500"
                }`}
              />

              <input
                type="search"
                placeholder="Search formulas..."
                value={query}
                onChange={(e) =>
                  setQuery(e.target.value)
                }
                className={`
                  w-full bg-transparent
                  outline-none text-sm
                  ${dark
                    ? "text-white placeholder:text-zinc-500"
                    : "text-black placeholder:text-zinc-400"
                  }
                `}
              />
            </div>

            {/* FORMULA LIST */}
            <div className="p-6 overflow-y-auto max-h-[70vh]">

              <div className="space-y-4">

                {filtered.map(
                  (
                    formula
                  ) => (

                    <button
                      key={
                        formula.id
                      }

                      onClick={() => {
                        setSelectedSubject(
                          null
                        );

                        navigate(
                          `/formula-hub/${formula.id}`
                        );
                      }}

                      className={`
                        w-full text-left
                        rounded-3xl p-5 border
                        transition-all duration-300
                        hover:-translate-y-1
                        ${dark
                          ? "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                          : "bg-zinc-50 border-zinc-200 hover:border-zinc-300"
                        }
                      `}
                    >

                      <div className="flex items-start justify-between gap-4">

                        <div className="flex gap-4">

                          <div
                            className={`
                              w-12 h-12 rounded-2xl
                              flex items-center justify-center
                              flex-shrink-0
                              ${dark
                                ? "bg-black"
                                : "bg-white"
                              }
                            `}
                          >

                            <Calculator
                              className={`
                                w-6 h-6
                                ${dark
                                  ? "text-white"
                                  : "text-black"
                                }
                              `}
                            />
                          </div>

                          <div>

                            <h3
                              className={`
                                text-lg font-semibold
                                ${dark
                                  ? "text-white"
                                  : "text-black"
                                }
                              `}
                            >
                              {
                                formula.title
                              }
                            </h3>

                            <p
                              className={`
                                mt-2 text-sm line-clamp-2
                                ${dark
                                  ? "text-zinc-400"
                                  : "text-zinc-500"
                                }
                              `}
                            >
                              {
                                formula.explanation
                              }
                            </p>

                            <div
                              className={`
                                mt-3 inline-flex
                                px-3 py-1 rounded-full
                                text-xs
                                ${dark
                                  ? "bg-black text-zinc-300"
                                  : "bg-white text-zinc-700"
                                }
                              `}
                            >
                              {
                                formula.category
                              }
                            </div>
                          </div>
                        </div>

                        <ArrowRight
                          className={`
                            w-5 h-5 mt-1
                            flex-shrink-0
                            ${dark
                              ? "text-zinc-500"
                              : "text-zinc-400"
                            }
                          `}
                        />
                      </div>
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SubjectsPage;