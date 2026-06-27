import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Calculator,
  Brain,
  FlaskConical,
  Globe,
  Search,
  FileQuestion,
  TrendingUp,
  Target,
  ChevronRight,
  Calendar,
  Sparkles,
  Trophy,
  BarChart3,
  Layers3,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const PastQuestionsSubjects = ({ dark }) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const subjects = [
    {
      id: "englishlanguage",
      name: "English Language",
      icon: <BookOpen size={28} />,
      color: "from-indigo-500 via-blue-500 to-cyan-500",
      description: "Comprehension, lexis, structure and oral English.",
      topics: 24,
      latestYear: 2025,
      totalYears: 25,
    },
    {
      id: "mathematics",
      name: "Mathematics",
      icon: <Calculator size={28} />,
      color: "from-purple-500 via-fuchsia-500 to-pink-500",
      description: "Algebra, geometry, statistics and mensuration.",
      topics: 30,
      latestYear: 2025,
      totalYears: 25,
    },
    {
      id: "physics",
      name: "Physics",
      icon: <Target size={28} />,
      color: "from-cyan-500 via-sky-500 to-blue-500",
      description: "Mechanics, electricity and modern physics.",
      topics: 22,
      latestYear: 2025,
      totalYears: 25,
    },
    {
      id: "chemistry",
      name: "Chemistry",
      icon: <FlaskConical size={28} />,
      color: "from-orange-500 via-red-500 to-pink-500",
      description: "Organic, inorganic and physical chemistry.",
      topics: 20,
      latestYear: 2025,
      totalYears: 25,
    },
    {
      id: "biology",
      name: "Biology",
      icon: <Brain size={28} />,
      color: "from-green-500 via-emerald-500 to-teal-500",
      description: "Genetics, ecology and human biology.",
      topics: 26,
      latestYear: 2025,
      totalYears: 25,
    },
    {
      id: "government",
      name: "Government",
      icon: <Globe size={28} />,
      color: "from-yellow-500 via-orange-500 to-red-500",
      description: "Constitution, democracy and political institutions.",
      topics: 18,
      latestYear: 2025,
      totalYears: 25,
    },
    {
      id: "economics",
      name: "Economics",
      icon: <TrendingUp size={28} />,
      color: "from-pink-500 via-rose-500 to-red-500",
      description: "Demand, supply, inflation and macroeconomics.",
      topics: 19,
      latestYear: 2025,
      totalYears: 25,
    },
    {
      id: "literature",
      name: "Literature",
      icon: <FileQuestion size={28} />,
      color: "from-violet-500 via-fuchsia-500 to-purple-500",
      description: "Drama, poetry and prose appreciation.",
      topics: 21,
      latestYear: 2025,
      totalYears: 25,
    },
  ];

  /* =========================
     THEME
  ========================= */
  const bg = dark ? "bg-[#020617] text-white" : "bg-[#f8fafc] text-slate-900";

  const card = dark
    ? "bg-white/[0.05] border border-white/10 backdrop-blur-2xl"
    : "bg-white border border-slate-200 shadow-sm";

  const faded = dark ? "text-slate-400" : "text-slate-500";

  const input = dark
    ? "bg-white/[0.04] border-white/10 text-white placeholder:text-slate-500"
    : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400";

  /* =========================
     FILTER FIX (BUG FIX HERE)
  ========================= */
  const filtered = useMemo(() => {
    return subjects.filter((s) =>
      s.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  return (
    <div className={`min-h-screen ${bg}`}>
      {/* BACK BUTTON HEADER */}
      <div className="max-w-7xl mx-auto px-4 py-6 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            dark ? "bg-white/10" : "bg-slate-100"
          }`}
        >
          <ArrowLeft />
        </button>

        <div>
          <h1 className="text-2xl font-black">Past Questions</h1>
          <p className={`${faded}`}>Choose a subject to start practicing</p>
        </div>
      </div>

      {/* SEARCH */}
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-4 opacity-60" size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subject..."
            className={`w-full h-14 pl-12 pr-4 rounded-2xl border outline-none ${input}`}
          />
        </div>
      </div>

      {/* GRID */}
      <div className="max-w-7xl mx-auto px-4 pb-20 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map((subject) => (
          <button
            key={subject.id}
            onClick={() => navigate(`/past-questions/${subject.id}`)}
            className={`${card} rounded-3xl overflow-hidden text-left transition hover:scale-[1.02]`}
          >
            {/* HEADER */}
            <div className={`p-6 bg-gradient-to-r ${subject.color}`}>
              <div className="flex justify-between items-start text-white">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  {subject.icon}
                </div>
                <ChevronRight />
              </div>

              <h2 className="text-2xl font-black mt-6">{subject.name}</h2>
              <p className="text-white/80 text-sm mt-2">
                {subject.description}
              </p>
            </div>

            {/* BODY */}
            <div className="p-5 space-y-4">
              <div className="flex justify-between">
                <div className="flex items-center gap-2 text-green-500 font-semibold text-sm">
                  <Trophy size={16} />
                  CBT Ready
                </div>

                <div className="text-indigo-500 text-sm font-bold flex items-center gap-1">
                  Start <ChevronRight size={16} />
                </div>
              </div>

              <button
                className={`w-full h-12 rounded-2xl font-bold text-white bg-gradient-to-r ${subject.color}`}
              >
                View Questions
              </button>
            </div>
          </button>
        ))}
      </div>

      {/* EMPTY STATE */}
      {filtered.length === 0 && (
        <div className={`${card} max-w-2xl mx-auto p-10 text-center rounded-3xl`}>
          <Search className="mx-auto mb-4 text-indigo-500" size={40} />
          <h2 className="text-2xl font-black mb-2">No Subject Found</h2>
          <p className={faded}>Try a different search keyword.</p>
        </div>
      )}
    </div>
  );
};

export default PastQuestionsSubjects;