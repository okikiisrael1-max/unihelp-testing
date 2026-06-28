import {
  ArrowLeft,
  Bookmark,
} from "lucide-react";

import { useEffect, useState } from "react";

import FormulaCard from "../../components/FormulaCard";

import EmptyState from "../../components/EmptyState";

import { formulas } from "../../data/sampleFormulas";
import { useNavigate } from "react-router-dom";

const BookmarksPage = ({ dark = false }) => {

  const [bookmarked, setBookmarked] = useState([]);
  const navigate = useNavigate();

  // LOAD BOOKMARKS
  useEffect(() => {

    const savedFormulas =
      JSON.parse(
        localStorage.getItem("savedFormulas")
      ) || [];

    // FILTER MATCHING FORMULAS
    const bookmarkedFormulas = formulas.filter(
      (formula) =>
        savedFormulas.includes(formula.id)
    );

    setBookmarked(bookmarkedFormulas);

  }, []);

  // EMPTY STATE
  if (!bookmarked.length) {
    return (
      <>
      <button onClick={()=> navigate(-1)} className="flex gap-1.5 p-5 cursor-pointer"> <ArrowLeft size={22}/> Back</button>

      <EmptyState
        dark={dark}
        title="No Saved Formulas"
        description="Your bookmarked formulas will appear here."
      />
      </>
      
    );
  }

  return (
    <div
      className={`
        min-h-screen md:pt-20 px-4 sm:px-6 lg:px-10 py-6
        transition-all duration-300
        ${dark ? "bg-black" : "bg-zinc-50"}
      `}
    >
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="flex items-center gap-4 mb-8">

          <div
            className={`
              w-14 h-14 rounded-3xl
              flex items-center justify-center
              ${
                dark
                  ? "bg-zinc-900"
                  : "bg-white border border-zinc-200"
              }
            `}
          >
            <Bookmark
              className={`w-7 h-7 ${
                dark
                  ? "text-white"
                  : "text-black"
              }`}
            />
          </div>

          <div>

            <h1
              className={`
                text-2xl sm:text-3xl font-bold
                ${
                  dark
                    ? "text-white"
                    : "text-black"
                }
              `}
            >
              Saved Formulas
            </h1>

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
              Quickly access your important formulas.
            </p>

            {/* COUNT */}
            <p
              className={`
                mt-2 text-xs
                ${
                  dark
                    ? "text-zinc-500"
                    : "text-zinc-400"
                }
              `}
            >
              {bookmarked.length} saved formula
              {bookmarked.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* GRID */}
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">

          {bookmarked.map((formula) => (
            <FormulaCard
              key={formula.id}
              formula={formula}
              dark={dark}
            />
          ))}

        </div>
      </div>
    </div>
  );
};

export default BookmarksPage;
