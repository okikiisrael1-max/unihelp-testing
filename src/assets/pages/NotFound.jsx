import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Home, ArrowLeft, Search } from "lucide-react";

const cx = (...args) => args.filter(Boolean).join(" ");

export default function NotFound({ dark }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const bg = dark ? "bg-[#050816] text-white" : "bg-[#f5f7ff] text-gray-900";
  const subtle = dark ? "text-white/50" : "text-gray-500";
  const faint = dark ? "text-white/35" : "text-gray-400";
  const ringOffset = dark ? "focus-visible:ring-offset-[#050816]" : "focus-visible:ring-offset-white";

  const fieldWrap = cx(
    "flex items-center rounded-xl border overflow-hidden pl-4 pr-1.5 transition-colors",
    dark ? "bg-white/[0.04] border-white/10 focus-within:border-indigo-500" : "bg-white border-gray-200 focus-within:border-indigo-500"
  );
  const searchInput = cx(
    "flex-1 min-w-0 bg-transparent h-12 px-3 text-sm outline-none",
    dark ? "text-white placeholder:text-white/30" : "text-gray-900 placeholder:text-gray-400"
  );
  const primaryBtn = cx(
    "inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl text-sm font-semibold w-full sm:w-auto",
    "bg-indigo-600 hover:bg-indigo-700 text-white transition-colors",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
    ringOffset
  );
  const secondaryBtn = cx(
    "inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl text-sm font-semibold w-full sm:w-auto transition-colors",
    "focus:outline-none focus-visible:ring-2",
    ringOffset,
    dark ? "bg-white/[0.06] hover:bg-white/10 text-white focus-visible:ring-white/25" : "bg-gray-100 hover:bg-gray-200 text-gray-900 focus-visible:ring-gray-300"
  );

  const handleSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className={`relative flex min-h-screen items-center justify-center px-6 py-16 ${bg}`}>
      {/* One restrained accent, not a pair of neon blobs — keeps the moment calm rather than loud */}
      <div className="pointer-events-none absolute left-1/2 top-[38%] h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-[120px]" />

      <div className="relative z-10 w-full max-w-lg text-center">
        <span
          className={cx(
            "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-widest",
            dark ? "border-white/10 bg-white/5 text-white/50" : "border-gray-200 bg-white text-gray-500"
          )}
        >
          UniHelp · Err-404
        </span>

        <h1 className="mt-6 text-[84px] sm:text-[112px] font-black leading-none tabular-nums text-indigo-500">
          404
        </h1>

        <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight">
          This page isn't on the timetable
        </h2>

        <p className={cx("mx-auto mt-3 max-w-sm text-sm sm:text-base leading-relaxed", subtle)}>
          It may have moved, been renamed, or never existed. Search for what you need, or head back to solid ground.
        </p>

        <form onSubmit={handleSearch} className={cx(fieldWrap, "mt-8 mx-auto max-w-sm")}>
          <Search size={18} className={faint} aria-hidden />
          <label htmlFor="notfound-search" className="sr-only">Search UniHelp</label>
          <input
            id="notfound-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search UniHelp"
            className={searchInput}
          />
          <button
            type="submit"
            disabled={!query.trim()}
            className={cx(
              "h-9 px-4 rounded-lg text-sm font-semibold shrink-0 transition-colors",
              "bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
              ringOffset
            )}
          >
            Search
          </button>
        </form>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/" className={primaryBtn}>
            <Home size={16} />
            Back Home
          </Link>
          <button onClick={() => window.history.back()} className={secondaryBtn}>
            <ArrowLeft size={16} />
            Go Back
          </button>
        </div>

        <p className={cx("mt-12 text-xs", faint)}>
          © {new Date().getFullYear()} UniHelp - Smart Student Assistance Platform
        </p>
      </div>
    </div>
  );
}