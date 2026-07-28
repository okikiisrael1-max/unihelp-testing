import { FileWarning } from "lucide-react";

const EmptyState = ({ title, description, dark }) => {
  return (
    <div
      className={`
        min-h-screen flex items-center justify-center px-4 py-12
        ${dark ? "bg-black" : "bg-zinc-50"}
      `}
    >
      <div className="w-full max-w-sm text-center sm:max-w-md">
        <div
          className={`
            mx-auto flex h-16 w-16 items-center justify-center rounded-full sm:h-20 sm:w-20
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
            mt-5 text-xl font-bold sm:text-2xl
            ${dark ? "text-white" : "text-black"}
          `}
        >
          {title}
        </h2>

        <p
          className={`
            mt-3 text-sm leading-6 sm:text-base sm:leading-7
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
