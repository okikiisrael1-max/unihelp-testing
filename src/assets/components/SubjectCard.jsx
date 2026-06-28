import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const SubjectCard = ({ icon: Icon, title, count, dark }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/formula-hub/subject/${title.toLowerCase()}`);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className={`
        group min-w-0 rounded-3xl p-4 cursor-pointer sm:p-5
        border transition-all duration-300
        select-none
        ${
          dark
            ? "bg-zinc-900 border-zinc-800 hover:border-zinc-600"
            : "bg-white border-zinc-200 hover:border-zinc-400"
        }
      `}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {/* ICON */}
          <div
            className={`
              w-12 h-12 rounded-2xl
              flex items-center justify-center mb-4
              transition
              ${
                dark
                  ? "bg-zinc-800"
                  : "bg-zinc-100"
              }
            `}
          >
            <Icon
              className={`w-6 h-6 ${
                dark
                  ? "text-white"
                  : "text-black"
              }`}
            />
          </div>

          {/* TITLE */}
          <h3
            className={`line-clamp-2 text-base font-semibold sm:text-lg ${
              dark ? "text-white" : "text-black"
            }`}
          >
            {title}
          </h3>

          {/* COUNT */}
          <p
            className={`mt-1 text-sm ${
              dark
                ? "text-zinc-400"
                : "text-zinc-500"
            }`}
          >
            {count} formulas
          </p>
        </div>

        {/* ARROW */}
        <ChevronRight
          className={`h-5 w-5 shrink-0 transition-transform duration-300 group-hover:translate-x-1 ${
            dark
              ? "text-zinc-500"
              : "text-zinc-400"
          }`}
        />
      </div>
    </motion.div>
  );
};

export default SubjectCard;
