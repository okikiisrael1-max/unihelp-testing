import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, Sparkles, X } from "lucide-react";
import { allFeatures, featureSections } from "../data/features";

const FeaturesCatalog = ({ dark }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const theme = {
    bg: dark ? "bg-[#070b14] text-white" : "bg-[#f6f7fb] text-gray-900",
    card: dark
      ? "bg-white/5 border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.2)]"
      : "bg-white border border-gray-200/80 shadow-[0_8px_30px_rgba(15,23,42,0.05)]",
    soft: dark ? "bg-white/5" : "bg-gray-50",
    input: dark
      ? "bg-white/5 border border-white/10 focus-within:border-indigo-400/60"
      : "bg-white border border-gray-200 focus-within:border-indigo-400",
    iconTint: dark
      ? "bg-indigo-500/15 text-indigo-300"
      : "bg-indigo-50 text-indigo-600",
    textSoft: dark ? "text-gray-400" : "text-gray-500",
    textFaint: dark ? "text-gray-500" : "text-gray-400",
    border: dark ? "border-white/10" : "border-gray-200",
    accent: dark
      ? "from-indigo-500/20 via-sky-500/10 to-transparent"
      : "from-indigo-500/10 via-sky-500/5 to-transparent",
  };

  const categoryNames = ["All", ...featureSections.map((section) => section.title)];

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const isFiltering = normalizedQuery.length > 0 || activeCategory !== "All";

  const visibleFeatures = useMemo(() => {
    return allFeatures.filter((item) => {
      const matchesCategory = activeCategory === "All" || item.category === activeCategory;
      const matchesQuery =
        !normalizedQuery ||
        item.title.toLowerCase().includes(normalizedQuery) ||
        item.desc.toLowerCase().includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, normalizedQuery]);

  const clearFilters = () => {
    setSearchQuery("");
    setActiveCategory("All");
  };

  return (
    <div className={`min-h-screen py-8 md:py-10 px-4 md:px-6 lg:px-8 ${theme.bg}`}>
      <div className="mx-auto max-w-7xl">
        {/* ================================================= */}
        {/* HERO */}
        {/* ================================================= */}

        <div className={`relative overflow-hidden rounded-[32px] border p-6 md:p-8 lg:p-10 mb-6 ${theme.card}`}>
          {/* Gradient wash now actually carries the theme's color stops */}
          <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${theme.accent}`} />
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <Link
                to="/"
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${theme.card}`}
              >
                <ArrowLeft size={15} />
                Back to dashboard
              </Link>
              <h1 className="mt-4 text-3xl font-black leading-tight md:text-4xl lg:text-5xl">
                Explore all <span className="text-indigo-500">UniHelp features</span>
              </h1>
              <p className={`mt-3 max-w-2xl text-sm md:text-base leading-7 ${theme.textSoft}`}>
                Discover the complete set of academic, marketplace, and smart student tools built to simplify your campus life.
              </p>
            </div>

            <div className={`flex items-center gap-2 rounded-2xl border px-3 py-2 shrink-0 ${theme.card}`}>
              <Sparkles size={16} className="text-indigo-500 shrink-0" />
              <span className="text-sm font-semibold whitespace-nowrap">{allFeatures.length} tools available</span>
            </div>
          </div>
        </div>

        {/* ================================================= */}
        {/* SEARCH + CATEGORY FILTERS */}
        {/* ================================================= */}

        <div className={`rounded-[28px] border p-4 md:p-5 mb-6 ${theme.card}`}>
          <div
            className={`flex items-center gap-2.5 rounded-2xl px-4 h-12 transition ${theme.input}`}
          >
            <Search size={16} className={`shrink-0 ${theme.textFaint}`} />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search features"
              aria-label="Search features"
              className="flex-1 h-full bg-transparent text-sm outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition hover:bg-red-500/10 hover:text-red-500 ${theme.textFaint}`}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {categoryNames.map((name) => (
              <button
                key={name}
                onClick={() => setActiveCategory(name)}
                className={`rounded-full px-3 py-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  activeCategory === name
                    ? "bg-indigo-500 text-white shadow-sm"
                    : `${theme.card} hover:border-indigo-500/40 hover:text-indigo-500`
                }`}
              >
                {name}
              </button>
            ))}
          </div>

          {isFiltering && (
            <div className={`mt-4 flex items-center justify-between text-xs font-semibold ${theme.textSoft}`}>
              <span>
                Showing {visibleFeatures.length} of {allFeatures.length} tools
              </span>
              <button
                onClick={clearFilters}
                className="text-indigo-500 hover:text-indigo-400 transition font-bold"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* ================================================= */}
        {/* RESULTS GRID */}
        {/* ================================================= */}

        {visibleFeatures.length === 0 ? (
          <div className={`rounded-3xl p-10 text-center ${theme.soft}`}>
            <Search className="mx-auto mb-4 opacity-40" size={36} />
            <h3 className="font-bold mb-1">No features match your search</h3>
            <p className={`text-sm mb-4 ${theme.textSoft}`}>Try another keyword or category.</p>
            <button
              onClick={clearFilters}
              className="inline-flex px-4 py-2 rounded-xl bg-indigo-500 text-white text-sm font-bold hover:bg-indigo-600 transition"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleFeatures.map((item) => {
              const Icon = item.icon || Sparkles;
              return (
                <Link
                  key={`${item.category}-${item.title}`}
                  to={item.link}
                  className={`${theme.card} group relative overflow-hidden rounded-[24px] p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 transition group-hover:opacity-100" />
                  <div className="relative z-10">
                    <div className="flex items-start justify-between gap-3">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl shrink-0 ${theme.iconTint}`}>
                        <Icon size={20} />
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] shrink-0 ${theme.soft}`}>
                        {item.category}
                      </span>
                    </div>
                    <div className="mt-4">
                      <h3 className="font-black text-lg leading-tight">{item.title}</h3>
                      <p className={`mt-2 text-sm leading-6 ${theme.textSoft}`}>{item.desc}</p>
                    </div>
                    <div className="mt-5 flex items-center justify-between text-sm font-semibold text-indigo-500">
                      <span>Open feature</span>
                      <span className="transition group-hover:translate-x-1">→</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeaturesCatalog;