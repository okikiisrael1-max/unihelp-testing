import React, {
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  X,
  Brain,
  Target,
  Trophy,
  Sparkles,
  ShieldCheck,
  BookOpen,
  FlaskConical,
  LineChart,
  BriefcaseBusiness,
  Library,
  Globe2,
  Leaf,
  Landmark,
  MoonStar,
  Users,
  ScrollText,
  Calculator,
  Laptop2,
  Languages,
  Music2,
  Palette,
  CheckCircle2,
  ArrowRight,
  Clock3,
  Check,
} from "lucide-react";

/* =========================================================
SUBJECTS
========================================================= */

const SUBJECTS = [
  {
    name: "Mathematics",
    icon: Brain,
    color: "from-blue-500 to-indigo-600",
  },
  {
    name: "Physics",
    icon: Target,
    color: "from-cyan-500 to-sky-600",
  },
  {
    name: "Chemistry",
    icon: FlaskConical,
    color: "from-pink-500 to-rose-600",
  },
  {
    name: "Biology",
    icon: Sparkles,
    color: "from-emerald-500 to-green-600",
  },
  {
    name: "Government",
    icon: ShieldCheck,
    color: "from-orange-500 to-amber-600",
  },
  {
    name: "Economics",
    icon: LineChart,
    color: "from-lime-500 to-green-600",
  },
  {
    name: "Commerce",
    icon: BriefcaseBusiness,
    color: "from-yellow-500 to-orange-500",
  },
  {
    name: "Literature",
    icon: Library,
    color: "from-fuchsia-500 to-pink-600",
  },
  {
    name: "Geography",
    icon: Globe2,
    color: "from-teal-500 to-cyan-600",
  },
  {
    name: "Agricultural",
    icon: Leaf,
    color: "from-green-500 to-emerald-700",
  },
  {
    name: "CRS",
    icon: Landmark,
    color: "from-red-500 to-rose-700",
  },
  {
    name: "IRS",
    icon: MoonStar,
    color: "from-indigo-500 to-blue-700",
  },
  {
    name: "Civic Education",
    icon: Users,
    color: "from-slate-500 to-gray-700",
  },
  {
    name: "History",
    icon: ScrollText,
    color: "from-amber-600 to-yellow-700",
  },
  {
    name: "Accounting",
    icon: Calculator,
    color: "from-blue-600 to-cyan-700",
  },
  {
    name: "Computer",
    icon: Laptop2,
    color: "from-sky-500 to-indigo-700",
  },
  {
    name: "French",
    icon: Languages,
    color: "from-blue-500 to-red-500",
  },
  {
    name: "Music",
    icon: Music2,
    color: "from-purple-500 to-fuchsia-700",
  },
  {
    name: "Arts",
    icon: Palette,
    color: "from-pink-500 to-orange-500",
  },
];

/* =========================================================
COMPONENT
========================================================= */

const FullMockSetup = ({ dark }) => {
  const navigate = useNavigate();

  const [selectedSubjects, setSelectedSubjects] =
    useState([]);

  const [showModal, setShowModal] =
    useState(false);

  /* =========================================================
  THEME
  ========================================================= */

  const theme = {
    bg: dark
      ? "bg-[#050816] text-white"
      : "bg-[#f5f7fb] text-slate-900",

    card: dark
      ? "bg-white/[0.04] border border-white/10"
      : "bg-white border border-slate-200 shadow-sm",

    hover: dark
      ? "hover:bg-white/[0.06]"
      : "hover:bg-slate-50",

    muted: dark
      ? "text-slate-400"
      : "text-slate-500",

    surface: dark
      ? "bg-white/[0.04] border border-white/10"
      : "bg-white border border-slate-200",

    overlay:
      "bg-black/70 backdrop-blur-xl",

    glow: dark
      ? "shadow-[0_0_80px_rgba(99,102,241,0.15)]"
      : "shadow-[0_0_60px_rgba(0,0,0,0.05)]",
  };

  /* =========================================================
  SUBJECTS
  ========================================================= */

  const allSubjects = useMemo(() => {
    return [
      "English",
      ...selectedSubjects,
    ];
  }, [selectedSubjects]);

  /* =========================================================
  TOGGLE SUBJECT
  ========================================================= */

  const toggleSubject = (subject) => {
    const exists =
      selectedSubjects.includes(subject);

    if (exists) {
      setSelectedSubjects((prev) =>
        prev.filter(
          (item) => item !== subject,
        ),
      );

      return;
    }

    if (selectedSubjects.length >= 3)
      return;

    const updated = [
      ...selectedSubjects,
      subject,
    ];

    setSelectedSubjects(updated);

    if (updated.length === 3) {
      setTimeout(() => {
        setShowModal(true);
      }, 300);
    }
  };

  /* =========================================================
  START MOCK
  ========================================================= */

  const startMock = () => {
    navigate("/mock-exam", {
      state: {
        subjects: allSubjects,
      },
    });
  };

  /* =========================================================
  PROGRESS
  ========================================================= */

  const progress =
    (selectedSubjects.length / 3) * 100;

  /* =========================================================
  UI
  ========================================================= */

  return (
    <div
      className={`min-h-screen relative overflow-hidden ${theme.bg}`}
    >
      {/* BACKGROUND */}

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[-120px] left-[-120px] w-[320px] h-[320px] rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="absolute bottom-[-150px] right-[-150px] w-[350px] h-[350px] rounded-full bg-cyan-500/20 blur-3xl" />

        <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      {/* MAIN */}

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* HERO */}

        <div className="max-w-3xl mx-auto text-center">
          <div
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-6 ${theme.surface}`}
          >
            <Sparkles size={15} />

            <span className="text-sm font-bold tracking-wide">
              JAMB CBT MOCK EXAMINATION
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
            Select Your
            <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              {" "}
              4 Subjects
            </span>
          </h1>

          <p
            className={`mt-5 text-sm sm:text-lg leading-relaxed max-w-2xl mx-auto ${theme.muted}`}
          >
            English Language is compulsory.
            Choose 3 additional subjects to
            begin your real JAMB CBT mock
            examination experience.
          </p>
        </div>

        {/* STATS */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-10">
          <div
            className={`rounded-[28px] p-6 ${theme.card} ${theme.glow}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-sm ${theme.muted}`}
                >
                  Selected
                </p>

                <h2 className="text-5xl font-black mt-2">
                  {
                    selectedSubjects.length
                  }
                  /3
                </h2>
              </div>

              <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center">
                <CheckCircle2 size={30} />
              </div>
            </div>
          </div>

          <div
            className={`rounded-[28px] p-6 ${theme.card}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-sm ${theme.muted}`}
                >
                  Duration
                </p>

                <h2 className="text-5xl font-black mt-2">
                  2H
                </h2>
              </div>

              <div className="w-16 h-16 rounded-2xl bg-red-500 text-white flex items-center justify-center">
                <Clock3 size={30} />
              </div>
            </div>
          </div>

          <div
            className={`rounded-[28px] p-6 ${theme.card}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-sm ${theme.muted}`}
                >
                  Questions
                </p>

                <h2 className="text-5xl font-black mt-2">
                  180
                </h2>
              </div>

              <div className="w-16 h-16 rounded-2xl bg-green-500 text-white flex items-center justify-center">
                <BookOpen size={30} />
              </div>
            </div>
          </div>
        </div>

        {/* SUBJECT SUMMARY */}

        <div
          className={`mt-8 rounded-[32px] p-6 sm:p-7 ${theme.card}`}
        >
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            {/* LEFT */}

            <div>
              <h2 className="text-3xl font-black">
                Your Subjects
              </h2>

              <p
                className={`mt-2 ${theme.muted}`}
              >
                Select 3 subjects to continue
              </p>
            </div>

            {/* RIGHT */}

            <div className="flex flex-wrap gap-3">
              <div className="px-5 py-3 rounded-2xl bg-white text-black font-black flex items-center gap-2">
                <CheckCircle2 size={18} />

                English
              </div>

              {selectedSubjects.map(
                (subject) => (
                  <div
                    key={subject}
                    className={`px-5 py-3 rounded-2xl font-bold ${theme.surface}`}
                  >
                    {subject}
                  </div>
                ),
              )}
            </div>
          </div>

          {/* PROGRESS */}

          <div className="mt-7">
            <div className="flex items-center justify-between mb-3">
              <p
                className={`text-sm font-semibold ${theme.muted}`}
              >
                Completion
              </p>

              <p className="text-sm font-bold">
                {Math.round(progress)}%
              </p>
            </div>

            <div
              className={`h-3 rounded-full overflow-hidden ${
                dark
                  ? "bg-white/10"
                  : "bg-slate-200"
              }`}
            >
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* SUBJECT GRID */}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mt-8">
          {SUBJECTS.map((subject) => {
            const active =
              selectedSubjects.includes(
                subject.name,
              );

            const disabled =
              !active &&
              selectedSubjects.length >= 3;

            const Icon = subject.icon;

            return (
              <button
                key={subject.name}
                onClick={() =>
                  toggleSubject(
                    subject.name,
                  )
                }
                disabled={disabled}
                className={`relative overflow-hidden rounded-[32px] p-6 text-left transition-all duration-300 group ${
                  active
                    ? "bg-white text-black scale-[1.02] shadow-2xl"
                    : `${theme.card} ${theme.hover}`
                } ${
                  disabled
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:-translate-y-1"
                }`}
              >
                {/* GRADIENT */}

                <div
                  className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-br ${subject.color} opacity-10 rounded-full blur-3xl`}
                />

                {/* TOP */}

                <div className="relative z-10 flex items-start justify-between">
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                      active
                        ? "bg-black/10"
                        : dark
                          ? "bg-white/5"
                          : "bg-slate-100"
                    }`}
                  >
                    <Icon size={28} />
                  </div>

                  {active && (
                    <div className="w-11 h-11 rounded-2xl bg-black text-white flex items-center justify-center">
                      <Check size={18} />
                    </div>
                  )}
                </div>

                {/* BODY */}

                <div className="relative z-10 mt-8">
                  <h2 className="text-3xl font-black">
                    {subject.name}
                  </h2>

                  <p
                    className={`mt-3 text-sm leading-relaxed ${
                      active
                        ? "text-black/70"
                        : theme.muted
                    }`}
                  >
                    Practice real CBT questions,
                    improve speed, accuracy, and
                    exam confidence.
                  </p>
                </div>

                {/* FOOTER */}

                <div className="relative z-10 mt-8 flex items-center justify-between">
                  <span
                    className={`text-xs uppercase tracking-[0.25em] font-bold ${
                      active
                        ? "text-black/60"
                        : theme.muted
                    }`}
                  >
                    CBT READY
                  </span>

                  <ArrowRight
                    size={18}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* MODAL */}

      {showModal && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${theme.overlay}`}
        >
          <div
            className={`relative w-full max-w-lg rounded-[36px] p-7 sm:p-8 ${theme.card}`}
          >
            {/* CLOSE */}

            <div className="flex justify-end">
              <button
                onClick={() =>
                  setShowModal(false)
                }
                className={`w-12 h-12 rounded-2xl flex items-center justify-center ${theme.surface}`}
              >
                <X size={20} />
              </button>
            </div>

            {/* ICON */}

            <div className="w-24 h-24 rounded-[30px] bg-gradient-to-br from-indigo-500 to-cyan-500 text-white mx-auto flex items-center justify-center mt-2 shadow-2xl">
              <ShieldCheck size={45} />
            </div>

            {/* TEXT */}

            <div className="text-center mt-6">
              <h1 className="text-4xl font-black">
                Ready To Start?
              </h1>

              <p
                className={`mt-4 leading-relaxed ${theme.muted}`}
              >
                Your subjects have been
                selected successfully. Start
                your real JAMB CBT simulation
                now.
              </p>
            </div>

            {/* SUBJECTS */}

            <div className="flex flex-wrap justify-center gap-3 mt-7">
              {allSubjects.map((subject) => (
                <div
                  key={subject}
                  className={`px-4 py-3 rounded-2xl text-sm font-bold ${theme.surface}`}
                >
                  {subject}
                </div>
              ))}
            </div>

            {/* ACTIONS */}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
              <button
                onClick={() =>
                  setShowModal(false)
                }
                className={`h-14 rounded-2xl font-bold ${theme.surface}`}
              >
                Edit Subjects
              </button>

              <button
                onClick={startMock}
                className="h-14 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-black flex items-center justify-center gap-3"
              >
                Start Mock
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FullMockSetup;