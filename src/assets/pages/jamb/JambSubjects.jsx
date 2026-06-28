import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Brain,
  Calculator,
  ChevronRight,
  FileQuestion,
  FlaskConical,
  Globe,
  Search,
  Target,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const JambSubjects = ({ dark = false }) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const subjects = [
    {
      id: "english",
      name: "English Language",
      icon: BookOpen,
      questions: 2450,
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: "mathematics",
      name: "Mathematics",
      icon: Calculator,
      questions: 1980,
      color: "from-purple-500 to-pink-500",
    },
    {
      id: "physics",
      name: "Physics",
      icon: Target,
      questions: 1540,
      color: "from-orange-500 to-red-500",
    },
    {
      id: "chemistry",
      name: "Chemistry",
      icon: FlaskConical,
      questions: 1720,
      color: "from-emerald-500 to-teal-500",
    },
    {
      id: "biology",
      name: "Biology",
      icon: Brain,
      questions: 1860,
      color: "from-green-500 to-lime-500",
    },
    {
      id: "government",
      name: "Government",
      icon: Globe,
      questions: 980,
      color: "from-sky-500 to-indigo-500",
    },
    {
      id: "economics",
      name: "Economics",
      icon: FileQuestion,
      questions: 1240,
      color: "from-amber-500 to-orange-500",
    },
    {
      id: "literature",
      name: "Literature",
      icon: BookOpen,
      questions: 860,
      color: "from-fuchsia-500 to-purple-500",
    },
  ];

  const filteredSubjects = useMemo(() => {
    return subjects.filter((subject) =>
      subject.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const totalQuestions = subjects.reduce(
    (sum, item) => sum + item.questions,
    0
  );

  return (
    <div
      className={`min-h-screen transition-all duration-500 ${
        dark
          ? "bg-[#020617] text-white"
          : "bg-slate-50 text-slate-900"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-6 lg:px-8">
        {/* HEADER */}

        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all ${
              dark
                ? "bg-white/5 border border-white/10 hover:bg-white/10"
                : "bg-white border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <ArrowLeft size={20} />
          </button>

          <div
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              dark
                ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                : "bg-indigo-50 text-indigo-600 border border-indigo-100"
            }`}
          >
            JAMB CBT Practice
          </div>
        </div>

        {/* HERO */}

        <div
          className={`relative overflow-hidden rounded-3xl p-8 lg:p-10 mb-8 ${
            dark
              ? "bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border border-white/10"
              : "bg-gradient-to-br from-indigo-50 via-white to-purple-50 border border-slate-200"
          }`}
        >
          <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 mb-5">
              <Sparkles size={14} />
              <span className="text-sm font-medium">
                Prepare Smarter
              </span>
            </div>

            <h1 className="text-4xl lg:text-5xl font-black leading-tight mb-4">
              Select a Subject
            </h1>

            <p
              className={`max-w-2xl text-base lg:text-lg ${
                dark ? "text-slate-400" : "text-slate-600"
              }`}
            >
              Practice thousands of past JAMB questions,
              improve your speed, accuracy, and exam confidence.
            </p>
          </div>
        </div>

        {/* STATS */}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div
            className={`rounded-3xl p-5 ${
              dark
                ? "bg-white/5 border border-white/10"
                : "bg-white border border-slate-200"
            }`}
          >
            <h3 className="text-3xl font-black">
              {subjects.length}
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              Subjects
            </p>
          </div>

          <div
            className={`rounded-3xl p-5 ${
              dark
                ? "bg-white/5 border border-white/10"
                : "bg-white border border-slate-200"
            }`}
          >
            <h3 className="text-3xl font-black">
              {totalQuestions.toLocaleString()}
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              Questions
            </p>
          </div>

          <div
            className={`rounded-3xl p-5 ${
              dark
                ? "bg-white/5 border border-white/10"
                : "bg-white border border-slate-200"
            }`}
          >
            <h3 className="text-3xl font-black">100%</h3>
            <p className="text-sm text-slate-400 mt-1">
              CBT Format
            </p>
          </div>

          <div
            className={`rounded-3xl p-5 ${
              dark
                ? "bg-white/5 border border-white/10"
                : "bg-white border border-slate-200"
            }`}
          >
            <h3 className="text-3xl font-black">24/7</h3>
            <p className="text-sm text-slate-400 mt-1">
              Access
            </p>
          </div>
        </div>

        {/* SEARCH */}

        <div className="relative mb-8">
          <Search
            size={20}
            className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subjects..."
            className={`w-full h-14 rounded-2xl pl-14 pr-4 outline-none transition-all ${
              dark
                ? "bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-500"
                : "bg-white border border-slate-200 focus:border-indigo-500"
            }`}
          />
        </div>

        {/* SUBJECT GRID */}

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredSubjects.map((subject) => {
            const Icon = subject.icon;

            return (
              <button
                key={subject.id}
                onClick={() => navigate(`/subjects/${subject.id}`)}
                className={`group rounded-3xl p-5 text-left transition-all duration-300 hover:-translate-y-2 ${
                  dark
                    ? "bg-white/5 border border-white/10 hover:border-indigo-500/30"
                    : "bg-white border border-slate-200 hover:shadow-xl"
                }`}
              >
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${subject.color} flex items-center justify-center text-white mb-5 shadow-lg`}
                >
                  <Icon size={24} />
                </div>

                <h2 className="text-lg font-bold mb-2">
                  {subject.name}
                </h2>

                <p
                  className={`text-sm mb-5 ${
                    dark
                      ? "text-slate-400"
                      : "text-slate-500"
                  }`}
                >
                  {subject.questions.toLocaleString()} Questions
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-indigo-400 font-medium">
                    Start Practice
                  </span>

                  <ChevronRight
                    size={18}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </div>
              </button>
            );
          })}
        </div>

        {filteredSubjects.length === 0 && (
          <div
            className={`rounded-3xl p-10 mt-8 text-center ${
              dark
                ? "bg-white/5 border border-white/10"
                : "bg-white border border-slate-200"
            }`}
          >
            <Search
              size={45}
              className="mx-auto mb-4 text-slate-400"
            />

            <h2 className="text-2xl font-bold mb-2">
              No Subject Found
            </h2>

            <p className="text-slate-400">
              Try searching with a different keyword.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JambSubjects;
