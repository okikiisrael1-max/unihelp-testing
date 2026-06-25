import { FileWarning } from "lucide-react";

const EmptyState = ({ title, description, dark }) => {
  return (
    <div
      className={`
        min-h-screen flex items-center justify-center px-4
        ${dark ? "bg-black" : "bg-zinc-50"}
      `}
    >
      <div className="text-center max-w-sm">
        <div
          className={`
            w-20 h-20 rounded-full mx-auto
            flex items-center justify-center
            ${dark ? "bg-zinc-900" : "bg-white"}
          `}
        >
          <FileWarning
            className={`w-10 h-10 ${
              dark ? "text-white" : "text-black"
            }`}
          />
        </div>

        <h2
          className={`
            mt-6 text-2xl font-bold
            ${dark ? "text-white" : "text-black"}
          `}
        >
          {title}
        </h2>

        <p
          className={`
            mt-3 leading-7
            ${dark ? "text-zinc-400" : "text-zinc-600"}
          `}
        >
          {description}
        </p>
      </div>
    </div>
  );
};

export default EmptyState;