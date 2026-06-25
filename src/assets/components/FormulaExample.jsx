import { BookOpen } from "lucide-react";

const FormulaExample = ({ example, dark }) => {
  return (
    <div className="mt-8">
      <h2
        className={`
          text-lg font-semibold mb-4
          ${dark ? "text-white" : "text-black"}
        `}
      >
        Example
      </h2>

      <div
        className={`
          rounded-3xl p-5 border
          ${
            dark
              ? "bg-zinc-800 border-zinc-700"
              : "bg-zinc-100 border-zinc-200"
          }
        `}
      >
        <div className="flex items-start gap-4">
          <div
            className={`
              w-12 h-12 rounded-2xl
              flex items-center justify-center
              ${dark ? "bg-zinc-900" : "bg-white"}
            `}
          >
            <BookOpen
              className={`w-6 h-6 ${
                dark ? "text-white" : "text-black"
              }`}
            />
          </div>

          <div>
            <p
              className={`
                leading-7
                ${dark ? "text-zinc-300" : "text-zinc-700"}
              `}
            >
              {example}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormulaExample;