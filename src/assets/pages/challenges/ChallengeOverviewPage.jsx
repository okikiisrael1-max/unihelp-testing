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
import { CATEGORY_TONES, colors } from "../../data/theme";

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

export default function ChallengeOverviewPage({ theme, stats, history, handleStartQuiz, getRankColor, getStatusColor, challengeCategories }) {
  const featured = challengeCategories.filter((c) => FEATURED_IDS.includes(c.id));
  const recent = (history || []).slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.28em] flex items-center gap-2 text-[#6C5CE7]">
              <Sparkles size={14} /> Challenges
            </h2>
            <span className="text-xs uppercase tracking-[0.18em] text-[#8B8676]">UniHelp leaderboard</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {featured.map((cat) => {
              const Icon = ICONS[cat.icon] || Sparkles;
              const tone = CATEGORY_TONES[cat.id]?.accent || colors.violet;
              const tint = CATEGORY_TONES[cat.id]?.tint || "rgba(108,92,231,0.12)";
              return (
                <button
                  key={cat.id}
                  onClick={() => handleStartQuiz(cat)}
                  className={`group relative overflow-hidden rounded-3xl border p-5 text-left transition ${theme.cardHover} ${theme.card}`}
                >
                  <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full opacity-60 blur-xl" style={{ background: tint }} />
                  <div className="relative">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: tint, color: tone }}>
                      <Icon size={18} />
                    </div>
                    <h3 className="font-semibold text-base mb-2">{cat.title}</h3>
                    <p className={`text-sm ${theme.textSoft} mb-5 line-clamp-2`}>{cat.subtitle}</p>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: tone }}>
                        Begin
                      </span>
                      <ArrowUpRight size={15} className="opacity-40 transition-all group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" style={{ color: tone }} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.28em] flex items-center gap-2 text-[#6C5CE7]">
              <Clock size={14} /> Recent activity
            </h2>
            <span className="text-xs text-[#8B8676]">Latest five attempts</span>
          </div>
          <div className={`${theme.card} rounded-3xl divide-y ${theme.ledgerLine}`}>
            {recent.length === 0 && (
              <div className="p-6 text-center">
                <p className={`text-sm ${theme.textSoft}`}>No attempts yet. Your first entry starts the leaderboard journey.</p>
              </div>
            )}
            {recent.map((item, idx) => (
              <div key={item.id} className={`grid grid-cols-[1fr_auto] gap-4 p-4 ${idx % 2 === 0 ? theme.soft : ""}`}>
                <div className="min-w-0">
                  <p className="text-sm font-semibold capitalize truncate">{(item.category || "daily").replace("-", " ")}</p>
                  <p className={`text-xs ${theme.textSoft}`}>{item.score}/{item.totalQuestions} correct</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold tabular-nums ${getStatusColor(item.accuracy || 0)}`}>{item.accuracy || 0}%</p>
                  <p className={`text-[11px] ${theme.textFaint}`}>{item.durationSeconds ? `${item.durationSeconds}s` : "—"}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <aside className="space-y-6">
        <div className={`${theme.card} rounded-3xl p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.28em]">Standing</h3>
            <span className="text-xs text-[#8B8676]">Your rank</span>
          </div>
          <div className="flex items-center justify-between mb-4 rounded-3xl border border-[#E4DEC7] bg-[#FBF8EE] p-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#8B8676]">Current tier</p>
              <p className="text-base font-semibold text-[#0E1220]">{stats?.rank || "Bronze"}</p>
            </div>
            <span
              className="px-3 py-1 rounded-full text-xs font-bold text-[#12182B]"
              style={{ background: getRankColor(stats?.rank) }}
            >
              {stats?.rank || "Bronze"}
            </span>
          </div>
          <div className="space-y-3">
            {[
              { label: "Longest streak", value: stats?.longestStreak || 0 },
              { label: "Questions answered", value: stats?.questionsAnswered || 0 },
              { label: "Total points", value: stats?.totalPoints || 0 },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-3">
                <span className={`text-xs ${theme.textSoft}`}>{row.label}</span>
                <span className="text-sm font-bold tabular-nums text-[#0E1220]">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`${theme.card} rounded-3xl p-6`}>
          <h3 className="text-sm font-semibold uppercase tracking-[0.28em] mb-3">Today</h3>
          <p className={`text-xs ${theme.textSoft}`}>
            {stats?.streakDates?.includes(new Date().toISOString().slice(0, 10))
              ? "You've already logged a challenge today — keep the streak alive by coming back tomorrow."
              : "No entry yet today. One challenge keeps the streak going."}
          </p>
        </div>
      </aside>
    </div>
  );
}
