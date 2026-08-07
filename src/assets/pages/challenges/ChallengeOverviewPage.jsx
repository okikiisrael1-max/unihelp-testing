import React from "react";
import {
  Calendar,
  Trophy,
  Library,
  Layers,
  Users,
  Timer,
  Lightbulb,
  Globe,
  Sparkles,
  ArrowUpRight,
  Flame,
  Clock,
} from "lucide-react";
import { CATEGORY_TONES } from "../../data/theme";

const ICONS = {
  calendar: Calendar,
  trophy: Trophy,
  library: Library,
  layers: Layers,
  users: Users,
  timer: Timer,
  lightbulb: Lightbulb,
  globe: Globe,
};

const FEATURED_IDS = ["daily", "speed-quiz", "weekly"];

export default function ChallengeOverviewPage({ theme, stats, history, handleStartQuiz, getRankColor, getStatusColor, dark, challengeCategories }) {
  const featured = challengeCategories.filter((c) => FEATURED_IDS.includes(c.id));
  const recent = (history || []).slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-widest flex items-center gap-2">
              <Sparkles size={14} className="text-[#6C5CE7]" /> Start a challenge
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {featured.map((cat) => {
              const Icon = ICONS[cat.icon] || Sparkles;
              const tone = CATEGORY_TONES[cat.id]?.accent || "#6C5CE7";
              const tint = CATEGORY_TONES[cat.id]?.tint || "rgba(108,92,231,0.12)";
              return (
                <button
                  key={cat.id}
                  onClick={() => handleStartQuiz(cat)}
                  className={`text-left ${theme.card} ${theme.cardHover} rounded-3xl p-5 transition-all group relative overflow-hidden`}
                >
                  <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-60 blur-xl" style={{ background: tint }} />
                  <div className="relative">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-4" style={{ background: tint, color: tone }}>
                      <Icon size={18} />
                    </div>
                    <h3 className="font-semibold text-[15px] mb-1">
                      {cat.title}
                    </h3>
                    <p className={`text-xs ${theme.textSoft} mb-4`}>{cat.subtitle}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: tone }}>
                        Begin
                      </span>
                      <ArrowUpRight size={15} className="opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" style={{ color: tone }} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-widest mb-3 flex items-center gap-2">
            <Clock size={14} className="text-[#6C5CE7]" /> Recent activity
          </h2>
          <div className={`${theme.card} rounded-3xl divide-y ${theme.ledgerLine}`}>
            {recent.length === 0 && (
              <div className="p-6 text-center">
                <p className={`text-sm ${theme.textSoft}`}>No attempts yet. Your first entry starts the ledger.</p>
              </div>
            )}
            {recent.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium capitalize truncate">{(item.category || "daily").replace("-", " ")}</p>
                  <p className={`text-xs ${theme.textSoft}`}>{item.score}/{item.totalQuestions} correct</p>
                </div>
                <span className={`text-xs font-bold shrink-0 ${getStatusColor(item.accuracy || 0)}`}>
                  {item.accuracy || 0}%
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <aside className="space-y-6">
        <div className={`${theme.card} rounded-3xl p-6`}>
          <h3 className="text-sm font-semibold uppercase tracking-widest mb-4">
            Standing
          </h3>
          <div className="flex items-center justify-between mb-4">
            <span className={`text-xs ${theme.textSoft}`}>Rank</span>
            <span
              className="px-3 py-1 rounded-full text-xs font-bold text-[#12182B]"
              style={{ background: getRankColor(stats?.rank) }}
            >
              {stats?.rank || "Bronze"}
            </span>
          </div>
          <div className="space-y-3">
            {[
              { label: "Longest streak", value: stats?.longestStreak || 0, icon: Flame },
              { label: "Questions answered", value: stats?.questionsAnswered || 0 },
              { label: "Total points", value: stats?.totalPoints || 0 },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <span className={`text-xs ${theme.textSoft}`}>{row.label}</span>
                <span className="text-sm font-bold tabular-nums">
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className={`${theme.card} rounded-3xl p-6`}>
          <h3 className="text-sm font-semibold uppercase tracking-widest mb-2">
            Today
          </h3>
          <p className={`text-xs ${theme.textSoft}`}>
            {stats?.streakDates?.includes(new Date().toISOString().slice(0, 10))
              ? "You've already logged a challenge today — come back tomorrow to keep the streak alive."
              : "No entry yet today. One challenge keeps the streak going."}
          </p>
        </div>
      </aside>
    </div>
  );
}