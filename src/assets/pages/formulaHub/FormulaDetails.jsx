import {
  ArrowLeft,
  Bookmark,
  Brain,
  Calculator,
  Share2,
  Sparkles,
  GraduationCap,
  Layers3,
  ChevronRight,
} from "lucide-react";

import {
  useParams,
  useNavigate,
} from "react-router-dom";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { formulas } from "../../data/sampleFormulas";

import {
  BlockMath,
  InlineMath,
} from "react-katex";

import "katex/dist/katex.min.css";

import FormulaVariables from "../../components/FormulaVariables";
import FormulaExample from "../../components/FormulaExample";
import EmptyState from "../../components/EmptyState";

const FormulaDetails = ({
  dark = false,
}) => {
  const { id } = useParams();

  const navigate = useNavigate();

  const [saved, setSaved] =
    useState(false);

  const [copied, setCopied] =
    useState(false);

  // FIND FORMULA
  const formula = useMemo(() => {
    return formulas.find(
      (item) =>
        String(item.id) ===
        String(id)
    );
  }, [id]);

  // RELATED FORMULAS
  const relatedFormulas =
    useMemo(() => {
      if (!formula) return [];

      return formulas
        .filter(
          (item) =>
            item.subject ===
              formula.subject &&
            item.id !== formula.id
        )
        .slice(0, 4);
    }, [formula]);

  // LOAD BOOKMARK
  useEffect(() => {
    if (!formula) return;

    const bookmarks =
      JSON.parse(
        localStorage.getItem(
          "saved_formulas"
        ) || "[]"
      );

    setSaved(
      bookmarks.includes(formula.id)
    );
  }, [formula]);

  // FORMULA NOT FOUND
  if (!formula) {
    return (
      <EmptyState
        dark={dark}
        title="Formula Not Found"
        description="The formula you are looking for does not exist."
      />
    );
  }

  // SHARE FUNCTION
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: formula.title,
          text: formula.explanation,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(
          window.location.href
        );

        setCopied(true);

        setTimeout(() => {
          setCopied(false);
        }, 2000);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // BOOKMARK FUNCTION
  const handleBookmark = () => {
    const bookmarks =
      JSON.parse(
        localStorage.getItem(
          "saved_formulas"
        ) || "[]"
      );

    let updated = [];

    if (
      bookmarks.includes(formula.id)
    ) {
      updated = bookmarks.filter(
        (item) => item !== formula.id
      );

      setSaved(false);
    } else {
      updated = [
        ...bookmarks,
        formula.id,
      ];

      setSaved(true);
    }

    localStorage.setItem(
      "saved_formulas",
      JSON.stringify(updated)
    );
  };

  // AI EXPLAIN
  const handleAIExplain = () => {
    navigate(
      `/ai-tutor?formula=${encodeURIComponent(
        formula.title
      )}`
    );
  };

  return (
    <div
      className={`
        min-h-screen
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

        {/* BACK BUTTON */}
        <button
          onClick={() => navigate(-1)}
          className={`
            flex items-center gap-2 mb-6
            text-sm font-medium
            transition-all duration-300
            hover:translate-x-[-3px]
            ${
              dark
                ? "text-zinc-300 hover:text-white"
                : "text-zinc-700 hover:text-black"
            }
          `}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* MAIN CARD */}
        <div
          className={`
            relative overflow-hidden
            rounded-[35px]
            border p-6 sm:p-8
            transition-all duration-300
            ${
              dark
                ? "bg-zinc-900 border-zinc-800"
                : "bg-white border-zinc-200"
            }
          `}
        >
          {/* BG EFFECT */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-green-500/10 blur-3xl rounded-full" />

          <div className="relative z-10">

            {/* HEADER */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">

              {/* LEFT */}
              <div className="flex gap-4">

                <div
                  className={`
                    w-16 h-16 rounded-3xl
                    flex items-center justify-center
                    flex-shrink-0
                    ${
                      dark
                        ? "bg-black"
                        : "bg-zinc-100"
                    }
                  `}
                >
                  <Calculator
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

                  {/* SUBJECT */}
                  <div className="flex flex-wrap items-center gap-3">

                    <div
                      className={`
                        px-3 py-1 rounded-full text-xs
                        flex items-center gap-2
                        ${
                          dark
                            ? "bg-black text-zinc-300"
                            : "bg-zinc-100 text-zinc-700"
                        }
                      `}
                    >
                      <GraduationCap className="w-3 h-3" />
                      {formula.subject}
                    </div>

                    <div
                      className={`
                        px-3 py-1 rounded-full text-xs
                        flex items-center gap-2
                        ${
                          dark
                            ? "bg-black text-zinc-300"
                            : "bg-zinc-100 text-zinc-700"
                        }
                      `}
                    >
                      <Layers3 className="w-3 h-3" />
                      {formula.category}
                    </div>

                    <div
                      className={`
                        px-3 py-1 rounded-full text-xs
                        ${
                          formula.level ===
                          "University"
                            ? "bg-purple-500/15 text-purple-400"
                            : "bg-green-500/15 text-green-400"
                        }
                      `}
                    >
                      {formula.level}
                    </div>
                  </div>

                  {/* TITLE */}
                  <h1
                    className={`
                      mt-4 text-3xl sm:text-4xl
                      font-bold leading-tight
                      ${
                        dark
                          ? "text-white"
                          : "text-black"
                      }
                    `}
                  >
                    {formula.title}
                  </h1>

                  {/* DESCRIPTION */}
                  <p
                    className={`
                      mt-4 max-w-2xl leading-7
                      ${
                        dark
                          ? "text-zinc-400"
                          : "text-zinc-600"
                      }
                    `}
                  >
                    {formula.explanation}
                  </p>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="flex items-center gap-3">

                {/* BOOKMARK */}
                <button
                  onClick={
                    handleBookmark
                  }
                  className={`
                    w-14 h-14 rounded-2xl
                    flex items-center justify-center
                    transition-all duration-300
                    ${
                      saved
                        ? "bg-yellow-500 text-black"
                        : dark
                        ? "bg-black text-white hover:bg-zinc-800"
                        : "bg-zinc-100 text-black hover:bg-zinc-200"
                    }
                  `}
                >
                  <Bookmark className="w-5 h-5" />
                </button>

                {/* SHARE */}
                <button
                  onClick={
                    handleShare
                  }
                  className={`
                    px-5 h-14 rounded-2xl
                    flex items-center gap-2
                    font-medium
                    transition-all duration-300
                    ${
                      dark
                        ? "bg-black text-white hover:bg-zinc-800"
                        : "bg-zinc-100 text-black hover:bg-zinc-200"
                    }
                  `}
                >
                  <Share2 className="w-5 h-5" />

                  {copied
                    ? "Copied"
                    : "Share"}
                </button>
              </div>
            </div>

            {/* FORMULA BOX */}
            <div
              className={`
                mt-10 rounded-[30px]
                p-6 sm:p-8 overflow-x-auto
                ${
                  dark
                    ? "bg-black border border-zinc-800"
                    : "bg-zinc-100 border border-zinc-200"
                }
              `}
            >
              <div className="min-w-max text-center">
                {formula.formula ? (
                  <BlockMath
                    math={
                      formula.formula
                    }
                  />
                ) : (
                  <p
                    className={
                      dark
                        ? "text-zinc-400"
                        : "text-zinc-600"
                    }
                  >
                    Formula unavailable
                  </p>
                )}
              </div>
            </div>

            {/* VARIABLES */}
            {formula.variables &&
              formula.variables.length >
                0 && (
                <div className="mt-10">
                  <FormulaVariables
                    variables={
                      formula.variables
                    }
                    dark={dark}
                  />
                </div>
              )}

            {/* EXAMPLE */}
            {formula.example && (
              <div className="mt-10">
                <FormulaExample
                  example={
                    formula.example
                  }
                  dark={dark}
                />
              </div>
            )}

            {/* AI BUTTON */}
            <button
              onClick={
                handleAIExplain
              }
              className={`
                mt-10
                flex items-center justify-center gap-3
                px-6 py-4 rounded-2xl
                font-semibold
                transition-all duration-300
                hover:scale-[1.02]
                ${
                  dark
                    ? "bg-white text-black hover:bg-zinc-200"
                    : "bg-black text-white hover:bg-zinc-800"
                }
              `}
            >
              <Brain className="w-5 h-5" />

              Explain with AI

              <Sparkles className="w-4 h-4 text-yellow-500" />
            </button>
          </div>
        </div>

        {/* RELATED FORMULAS */}
        {relatedFormulas.length >
          0 && (
          <div className="mt-10">

            <div className="flex items-center justify-between mb-5">

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
                Related Formulas
              </h2>

              <button
                onClick={() =>
                  navigate(
                    "/formula-hub"
                  )
                }
                className={`
                  text-sm font-medium
                  ${
                    dark
                      ? "text-zinc-400"
                      : "text-zinc-500"
                  }
                `}
              >
                View More
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-5">

              {relatedFormulas.map(
                (item) => (
                  <button
                    key={item.id}
                    onClick={() =>
                      navigate(
                        `/formula-hub/${item.id}`
                      )
                    }
                    className={`
                      text-left rounded-3xl
                      p-5 border
                      transition-all duration-300
                      hover:-translate-y-1
                      ${
                        dark
                          ? "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                          : "bg-white border-zinc-200 hover:border-zinc-300"
                      }
                    `}
                  >
                    <div className="flex items-start justify-between gap-4">

                      <div>

                        <h3
                          className={`
                            text-lg font-semibold
                            ${
                              dark
                                ? "text-white"
                                : "text-black"
                            }
                          `}
                        >
                          {item.title}
                        </h3>

                        <p
                          className={`
                            mt-2 text-sm line-clamp-2
                            ${
                              dark
                                ? "text-zinc-400"
                                : "text-zinc-600"
                            }
                          `}
                        >
                          {
                            item.explanation
                          }
                        </p>

                        <div
                          className={`
                            mt-4 inline-flex
                            px-3 py-1 rounded-full text-xs
                            ${
                              dark
                                ? "bg-black text-zinc-300"
                                : "bg-zinc-100 text-zinc-700"
                            }
                          `}
                        >
                          {
                            item.category
                          }
                        </div>
                      </div>

                      <ChevronRight
                        className={`
                          w-5 h-5 flex-shrink-0
                          ${
                            dark
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
        )}
      </div>
    </div>
  );
};

export default FormulaDetails;
