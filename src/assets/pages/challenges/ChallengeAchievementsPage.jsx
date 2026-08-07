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
      <div className="flex items-center justify-between mb-5">
        <p className={`text-sm ${theme.textSoft}`}>
          {unlockedCount} of {achievements.length} honors earned
        </p>
        <div className="w-32 h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
          <div className="h-full rounded-full bg-[#D4A72C] transition-all" style={{ width: `${(unlockedCount / (achievements.length || 1)) * 100}%` }} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {achievements.map((item) => {
          const Icon = ICONS[item.icon] || Award;
          return (
            <div
              key={item.id}
              className={`${theme.card} rounded-3xl p-5 relative overflow-hidden ${item.unlocked ? "" : "opacity-60"}`}
            >
              {item.unlocked && <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-[#D4A72C] opacity-[0.12] blur-xl" />}
              <div className="relative flex items-center gap-3 mb-3">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: item.unlocked ? "rgba(212,167,44,0.15)" : "rgba(120,120,120,0.12)", color: item.unlocked ? "#D4A72C" : undefined }}
                >
                  <Icon size={19} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm truncate">
                    {item.title}
                  </h3>
                  <p className={`text-[11px] ${theme.textFaint}`}>
                    {Math.min(item.value, item.target)}/{item.target}
                  </p>
                </div>
              </div>
              <div className="relative h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${item.progress * 100}%`, background: item.unlocked ? "#D4A72C" : "#6C5CE7" }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}