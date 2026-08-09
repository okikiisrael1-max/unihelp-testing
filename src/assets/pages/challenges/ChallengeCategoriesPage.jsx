import React from "react";
import { Calendar, Trophy, Library, Layers, Users, Timer, Lightbulb, Globe, Sparkles, ArrowUpRight } from "lucide-react";
import { CATEGORY_TONES, getTimeLimit, colors } from "../../data/theme";

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

export default function ChallengeCategoriesPage({ theme, stats, handleStartQuiz, challengeCategories }) {
  return (
    <div>
      <div className="mb-5 rounded-3xl border border-[#E9E5D9] bg-[#F8F6EE] p-5">
        <p className="text-sm text-slate-700">
          Eight boards, eight disciplines. Each one runs eight questions on its own clock and keeps your study habits moving.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {challengeCategories.map((cat) => {
          const Icon = ICONS[cat.icon] || Sparkles;
          const tone = CATEGORY_TONES[cat.id]?.accent || colors.violet;
          const tint = CATEGORY_TONES[cat.id]?.tint || "rgba(108,92,231,0.12)";
          const attempted = stats?.categoryStats?.[cat.id]?.attempted || 0;
          const correct = stats?.categoryStats?.[cat.id]?.correct || 0;
          const catAccuracy = attempted ? Math.round((correct / attempted) * 100) : null;
          return (
            <button
              key={cat.id}
              onClick={() => handleStartQuiz(cat)}
              className={`group relative overflow-hidden rounded-3xl border p-5 text-left transition ${theme.cardHover} ${theme.card}`}
            >
              <div className="absolute -top-10 -right-10 h-28 w-28 rounded-full opacity-60 blur-2xl" style={{ background: tint }} />
              <div className="relative mb-5 flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: tint, color: tone }}>
                  <Icon size={18} />
                </div>
                <span className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em]" style={{ background: tint, color: tone }}>
                  {getTimeLimit(cat.id)}s / q
                </span>
              </div>
              <h3 className="relative font-semibold text-base mb-2">{cat.title}</h3>
              <p className={`relative text-xs ${theme.textSoft} mb-5 line-clamp-2`}>{cat.subtitle}</p>
              <div className="flex items-center justify-between gap-3">
                <span className={`text-[11px] ${theme.textFaint}`}>
                  {catAccuracy !== null ? `${catAccuracy}% best` : "Not attempted"}
                </span>
                <ArrowUpRight size={15} className="opacity-40 transition-all group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" style={{ color: tone }} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
