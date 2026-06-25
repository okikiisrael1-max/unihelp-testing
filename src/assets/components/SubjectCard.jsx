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
        rounded-3xl p-5 cursor-pointer
        border transition-all duration-300
        select-none
        ${
          dark
            ? "bg-zinc-900 border-zinc-800 hover:border-zinc-600"
            : "bg-white border-zinc-200 hover:border-zinc-400"
        }
      `}
    >
      <div className="flex items-start justify-between">
        <div>
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
            className={`font-semibold text-lg ${
              dark ? "text-white" : "text-black"
            }`}
          >
            {title}
          </h3>

          {/* COUNT */}
          <p
            className={`text-sm mt-1 ${
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
          className={`w-5 h-5 transition-transform duration-300 group-hover:translate-x-1 ${
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