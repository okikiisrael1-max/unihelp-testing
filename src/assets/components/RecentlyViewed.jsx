import { History, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const RecentlyViewed = ({ formulas = [], dark }) => {
  const navigate = useNavigate();

  const handleOpen = (id) => {
    navigate(`/formula-hub/${id}`);
  };

  return (
    <div className="mt-10">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <History
            className={`w-5 h-5 ${
              dark ? "text-white" : "text-black"
            }`}
          />

          <h2
            className={`
              text-xl font-semibold
              ${dark ? "text-white" : "text-black"}
            `}
          >
            Recently Viewed
          </h2>
        </div>
      </div>

      {/* EMPTY STATE */}
      {formulas.length === 0 ? (
        <div
          className={`
            rounded-3xl p-10 text-center border
            ${
              dark
                ? "bg-zinc-900 border-zinc-800"
                : "bg-white border-zinc-200"
            }
          `}
        >
          <h3
            className={`text-lg font-semibold ${
              dark ? "text-white" : "text-black"
            }`}
          >
            No Recently Viewed Formulas
          </h3>

          <p
            className={`mt-2 text-sm ${
              dark ? "text-zinc-400" : "text-zinc-500"
            }`}
          >
            Start opening formulas to track your learning progress.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {formulas.map((formula, index) => (
            <motion.div
              key={formula.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleOpen(formula.id)}
              className={`
                cursor-pointer
                rounded-3xl p-5 border
                transition-all duration-300
                hover:scale-[1.02]
                ${
                  dark
                    ? "bg-zinc-900 border-zinc-800 hover:border-zinc-600"
                    : "bg-white border-zinc-200 hover:border-zinc-400"
                }
              `}
            >
              {/* TITLE */}
              <h3
                className={`
                  text-lg font-semibold
                  ${dark ? "text-white" : "text-black"}
                `}
              >
                {formula.title}
              </h3>

              {/* SUBJECT */}
              <p
                className={`
                  mt-2 text-sm
                  ${dark ? "text-zinc-400" : "text-zinc-500"}
                `}
              >
                {formula.subject}
              </p>

              {/* BUTTON */}
              <div
                className={`
                  mt-4 flex items-center gap-2
                  text-sm font-medium
                  transition
                  ${
                    dark
                      ? "text-white"
                      : "text-black"
                  }
                `}
              >
                Open Formula
                <ArrowRight className="w-4 h-4" />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentlyViewed;