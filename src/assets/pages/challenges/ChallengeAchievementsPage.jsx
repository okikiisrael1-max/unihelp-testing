import React from "react";
import { Flag, Flame, CheckCheck, Layers, Trophy, Library, Lightbulb, Timer, Crown, Sun, Moon, Star, Award } from "lucide-react";

const ICONS = {
  flag: Flag,
  flame: Flame,
  check: CheckCheck,
  layers: Layers,
  trophy: Trophy,
  library: Library,
  lightbulb: Lightbulb,
  timer: Timer,
  crown: Crown,
  sun: Sun,
  moon: Moon,
  star: Star,
};

export default function ChallengeAchievementsPage({ theme, achievements }) {
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
        <p className={`text-sm ${theme.textSoft}`}>
          {unlockedCount} of {achievements.length} honors earned
        </p>
        <div className="w-full max-w-sm overflow-hidden rounded-full bg-slate-100 h-2">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${(unlockedCount / (achievements.length || 1)) * 100}%`, background: "#D4A72C" }}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {achievements.map((item) => {
          const Icon = ICONS[item.icon] || Award;
          const accent = item.unlocked ? "#D4A72C" : "#6C5CE7";
          return (
            <div
              key={item.id}
              className={`${theme.card} rounded-3xl p-5 relative overflow-hidden transition ${item.unlocked ? "shadow-lg shadow-amber-200/20" : "opacity-80"}`}
            >
              {item.unlocked && <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-amber-300/10 blur-xl" />}
              <div className="relative flex items-center gap-3 mb-3">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-2xl shrink-0"
                  style={{ background: item.unlocked ? "rgba(212,167,44,0.15)" : "rgba(120,120,120,0.12)", color: accent }}
                >
                  <Icon size={19} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm truncate">{item.title}</h3>
                  <p className={`text-[11px] ${theme.textFaint}`}>{Math.min(item.value, item.target)}/{item.target}</p>
                </div>
              </div>
              <div className="relative h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${item.progress * 100}%`, background: accent }}
                />
              </div>
              {item.unlocked && (
                <span className="mt-4 inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                  <CheckCheck size={14} /> Unlocked
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
