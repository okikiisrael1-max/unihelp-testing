import { Search } from "lucide-react";

const SearchBar = ({ value, onChange, dark }) => {
  return (
    <div
      className={`
        flex w-full min-w-0 items-center gap-3
        rounded-2xl border px-4 py-3 transition-colors duration-300
        ${
          dark
            ? "bg-zinc-900 border-zinc-800"
            : "bg-white border-zinc-200"
        }
      `}
    >
      <Search
        className={`h-5 w-5 shrink-0 ${
          dark ? "text-zinc-400" : "text-zinc-500"
        }`}
      />

      <input
        type="text"
        placeholder="Search formulas..."
        value={value}
        onChange={onChange}
        className={`
          w-full min-w-0 bg-transparent text-sm outline-none sm:text-base
          ${dark ? "text-white" : "text-black"}
        `}
      />
    </div>
  );
};

export default SearchBar;
