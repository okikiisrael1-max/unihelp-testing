import {
  Bookmark,
  Calculator,
  ArrowRight,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { useState, useEffect } from "react";

import { BlockMath } from "react-katex";
import "katex/dist/katex.min.css";
import { motion } from "framer-motion";

const FormulaCard = ({ formula, dark = true }) => {
  const navigate = useNavigate();

  const [saved, setSaved] = useState(false);

  // Prevent crashes if formula is missing
  if (!formula) return null;

  // Load saved state
  useEffect(() => {
    const savedFormulas =
      JSON.parse(localStorage.getItem("savedFormulas")) || [];

    setSaved(savedFormulas.includes(formula.id));
  }, [formula.id]);

  // Toggle bookmark
  const handleBookmark = (e) => {
    e.stopPropagation();

    let savedFormulas =
      JSON.parse(localStorage.getItem("savedFormulas")) || [];

    if (saved) {
      savedFormulas = savedFormulas.filter(
        (id) => id !== formula.id
      );
    } else {
      savedFormulas.push(formula.id);
    }

    localStorage.setItem(
      "savedFormulas",
      JSON.stringify(savedFormulas)
    );

    setSaved(!saved);
  };

  // Navigate safely
  const handleNavigate = () => {
    if (!formula.id) return;

    navigate(`/formula-hub/${formula.id}`);
  };

  return (
    <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      onClick={handleNavigate}
      className={`
        rounded-3xl p-5 border cursor-pointer
        transition-all duration-300 hover:-translate-y-1
        hover:shadow-xl
        ${
          dark
            ? "bg-zinc-900 border-zinc-800"
            : "bg-white border-zinc-200"
        }
      `}
    >
      {/* TOP */}
      <div className="flex items-start justify-between">

        {/* ICON */}
        <div
          className={`
            w-12 h-12 rounded-2xl
            flex items-center justify-center
            ${
              dark
                ? "bg-zinc-800"
                : "bg-zinc-100"
            }
          `}
        >
          <Calculator
            className={`w-6 h-6 ${
              dark
                ? "text-white"
                : "text-black"
            }`}
          />
        </div>

        {/* BOOKMARK */}
        <button
          onClick={handleBookmark}
          aria-label="Bookmark formula"
          className={`
            p-2 rounded-xl transition-all duration-300
            ${
              saved
                ? "bg-yellow-500 text-black"
                : dark
                ? "bg-zinc-800 text-zinc-300"
                : "bg-zinc-100 text-zinc-600"
            }
          `}
        >
          <Bookmark
            className={`w-4 h-4 ${
              saved ? "fill-current" : ""
            }`}
          />
        </button>
      </div>

      {/* CONTENT */}
      <div className="mt-5">

        <h3
          className={`
            text-lg font-semibold line-clamp-1
            ${
              dark
                ? "text-white"
                : "text-black"
            }
          `}
        >
          {formula.title || "Untitled Formula"}
        </h3>

        <p
          className={`
            mt-2 text-sm leading-6
            line-clamp-3
            ${
              dark
                ? "text-zinc-400"
                : "text-zinc-500"
            }
          `}
        >
          {formula.explanation ||
            "No explanation available"}
        </p>
      </div>

      {/* FORMULA */}
      <div
        className={`
          mt-5 p-4 rounded-2xl
          overflow-x-auto
          ${
            dark
              ? "bg-black"
              : "bg-zinc-100"
          }
        `}
      >
        <div className="min-w-max text-center">
          {formula.formula ? (
            <BlockMath
              math={formula.formula}
              renderError={() => (
                <span
                  className={
                    dark
                      ? "text-red-400"
                      : "text-red-600"
                  }
                >
                  Invalid Formula
                </span>
              )}
            />
          ) : (
            <p
              className={
                dark
                  ? "text-zinc-500"
                  : "text-zinc-600"
              }
            >
              No formula available
            </p>
          )}
        </div>
      </div>

      {/* BUTTON */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleNavigate();
        }}
        className={`
          mt-5 flex items-center gap-2
          text-sm font-medium
          transition-all duration-300
          hover:gap-3
          ${
            dark
              ? "text-white"
              : "text-black"
          }
        `}
      >
        View Details
        <ArrowRight className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

export default FormulaCard;