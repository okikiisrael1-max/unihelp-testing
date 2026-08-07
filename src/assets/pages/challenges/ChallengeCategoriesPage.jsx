import React from "react";
import { Calendar, Trophy, Library, Layers, Users, Timer, Lightbulb, Globe, Sparkles, ArrowUpRight } from "lucide-react";
import { CATEGORY_TONES, getTimeLimit } from "../../data/theme";

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
      <p className={`text-sm ${theme.textSoft} mb-5`}>
        Eight boards, eight disciplines. Each one runs eight questions on its own clock.
      </p>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {challengeCategories.map((cat) => {
          const Icon = ICONS[cat.icon] || Sparkles;
          const tone = CATEGORY_TONES[cat.id]?.accent || "#6C5CE7";
          const tint = CATEGORY_TONES[cat.id]?.tint || "rgba(108,92,231,0.12)";
          const attempted = stats?.categoryStats?.[cat.id]?.attempted || 0;
          const correct = stats?.categoryStats?.[cat.id]?.correct || 0;
          const catAccuracy = attempted ? Math.round((correct / attempted) * 100) : null;
          return (
            <button
              key={cat.id}
              onClick={() => handleStartQuiz(cat)}
              className={`text-left ${theme.card} ${theme.cardHover} rounded-3xl p-5 transition-all group relative overflow-hidden`}
            >
              <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full opacity-60 blur-2xl" style={{ background: tint }} />
              <div className="relative flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: tint, color: tone }}>
                  <Icon size={18} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full" style={{ background: tint, color: tone }}>
                  {getTimeLimit(cat.id)}s / q
                </span>
              </div>
              <h3 className="relative font-semibold text-[15px] mb-1">
                {cat.title}
              </h3>
              <p className={`relative text-xs ${theme.textSoft} mb-4`}>{cat.subtitle}</p>
              <div className="relative flex items-center justify-between">
                <span className={`text-[11px] ${theme.textFaint}`}>
                  {catAccuracy !== null ? `${catAccuracy}% best` : "Not attempted"}
                </span>
                <ArrowUpRight size={15} className="opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" style={{ color: tone }} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}