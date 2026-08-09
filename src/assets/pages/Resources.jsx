import { useState } from "react";
import { BookOpen, ClipboardList } from "lucide-react";
import LectureNotesMarketplace from "./LectureNotesMarketplace";
import PastQuestions from "../components/PastQuestions";

const TABS = [
  { key: "notes", label: "Lecture notes", blurb: "Course materials shared by students", icon: BookOpen },
  { key: "questions", label: "Past questions", blurb: "Exam papers from previous sessions", icon: ClipboardList },
];

export default function Resources({ dark }) {
  const [tab, setTab] = useState("notes");
  const active = TABS.find((t) => t.key === tab);

  return (
    <div className="w-full md:mt-20">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 md:py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-5 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className={`mb-1 text-xs font-semibold uppercase tracking-[0.3em] ${dark ? "text-indigo-400" : "text-indigo-600"}`}>
              Resource center
            </p>
            <h1 className={`text-2xl font-bold sm:text-3xl ${dark ? "text-white" : "text-slate-900"}`}>
              {active.label}
            </h1>
            <p className={`mt-1 text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>{active.blurb}</p>
          </div>

          {/* Segmented toggle */}
          <div
            role="tablist"
            aria-label="Resource type"
            className={`grid grid-cols-2 gap-1 rounded-2xl p-1 sm:inline-grid ${
              dark ? "bg-white/5 ring-1 ring-white/10" : "bg-slate-100 ring-1 ring-slate-200"
            }`}
          >
            {TABS.map((t) => {
              const Icon = t.icon;
              const isActive = tab === t.key;
              return (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setTab(t.key)}
                  className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                      : dark
                      ? "text-slate-300 hover:bg-white/5 hover:text-white"
                      : "text-slate-500 hover:bg-white hover:text-slate-900"
                  }`}
                >
                  <Icon size={16} className={isActive ? "opacity-100" : "opacity-60"} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div>
          {tab === "notes" ? (
            <LectureNotesMarketplace dark={dark} />
          ) : (
            <PastQuestions dark={dark} />
          )}
        </div>
      </div>
    </div>
  );
}