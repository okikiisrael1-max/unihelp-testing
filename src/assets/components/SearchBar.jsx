import { Search } from "lucide-react";

const SearchBar = ({ value, onChange, dark }) => {
  return (
    <div
      className={`
        flex items-center gap-3
        px-4 py-3 rounded-2xl
        border transition-all duration-300
        ${
          dark
            ? "bg-zinc-900 border-zinc-800"
            : "bg-white border-zinc-200"
        }
      `}
    >
      <Search
        className={`w-5 h-5 ${
          dark ? "text-zinc-400" : "text-zinc-500"
        }`}
      />

      <input
        type="text"
        placeholder="Search formulas..."
        value={value}
        onChange={onChange}
        className={`
          bg-transparent outline-none w-full
          ${dark ? "text-white" : "text-black"}
        `}
      />
    </div>
  );
};

export default SearchBar;