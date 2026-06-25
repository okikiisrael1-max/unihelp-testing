import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Award,
  BadgeCheck,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  Crown,
  Flame,
  Lock,
  Medal,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Trophy,
} from "lucide-react";

const Achievements = ({
  dark = true,
}) => {
  const [selectedTab, setSelectedTab] =
    useState("all");

  const [progress, setProgress] =
    useState(0);

  /* ================= THEME ================= */

  const bg = dark
    ? "bg-[#020617] text-white"
    : "bg-[#f8fafc] text-slate-900";

  const card = dark
    ? "bg-white/5 border border-white/10 backdrop-blur-xl"
    : "bg-white border border-slate-200 shadow-sm";

  const softText = dark
    ? "text-slate-400"
    : "text-slate-500";

  /* ================= FAKE USER DATA ================= */

  const stats = {
    totalXP: 4820,
    streak: 21,
    rank: "Top 3%",
    completed: 18,
    total: 28,
  };

  const achievements = [
    {
      id: 1,
      title: "First CBT Completed",
      description:
        "Complete your first CBT practice.",
      icon: <BrainCircuit size={26} />,
      earned: true,
      xp: 120,
      progress: 100,
      category: "study",
      rarity: "Common",
      color:
        "from-indigo-500 to-blue-600",
    },

    {
      id: 2,
      title: "7 Days Streak",
      description:
        "Study consistently for 7 days.",
      icon: <Flame size={26} />,
      earned: true,
      xp: 250,
      progress: 100,
      category: "streak",
      rarity: "Rare",
      color:
        "from-orange-500 to-red-500",
    },

    {
      id: 3,
      title: "Math Genius",
      description:
        "Score above 90% in Mathematics.",
      icon: <Target size={26} />,
      earned: true,
      xp: 350,
      progress: 100,
      category: "exam",
      rarity: "Epic",
      color:
        "from-emerald-500 to-green-600",
    },

    {
      id: 4,
      title: "Top Leaderboard",
      description:
        "Reach Top 10 on leaderboard.",
      icon: <Trophy size={26} />,
      earned: false,
      xp: 800,
      progress: 68,
      category: "rank",
      rarity: "Legendary",
      color:
        "from-yellow-400 to-orange-500",
    },

    {
      id: 5,
      title: "AI Study Master",
      description:
        "Use AI tutor for 30 sessions.",
      icon: <Sparkles size={26} />,
      earned: false,
      xp: 500,
      progress: 42,
      category: "ai",
      rarity: "Epic",
      color:
        "from-purple-500 to-pink-500",
    },

    {
      id: 6,
      title: "Perfect Accuracy",
      description:
        "Answer 50 questions correctly in a row.",
      icon: <ShieldCheck size={26} />,
      earned: false,
      xp: 1200,
      progress: 23,
      category: "exam",
      rarity: "Mythic",
      color:
        "from-cyan-500 to-sky-600",
    },

    {
      id: 7,
      title: "Study Warrior",
      description:
        "Study for 100 total hours.",
      icon: <Rocket size={26} />,
      earned: true,
      xp: 700,
      progress: 100,
      category: "study",
      rarity: "Rare",
      color:
        "from-pink-500 to-rose-500",
    },

    {
      id: 8,
      title: "Champion",
      description:
        "Unlock 20 achievements.",
      icon: <Crown size={26} />,
      earned: false,
      xp: 2000,
      progress: 75,
      category: "special",
      rarity: "Legendary",
      color:
        "from-amber-400 to-yellow-500",
    },
  ];

  /* ================= XP ANIMATION ================= */

  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(82);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  /* ================= FILTER ================= */

  const filteredAchievements =
    useMemo(() => {
      if (selectedTab === "all")
        return achievements;

      if (
        selectedTab === "earned"
      ) {
        return achievements.filter(
          (a) => a.earned
        );
      }

      if (
        selectedTab === "locked"
      ) {
        return achievements.filter(
          (a) => !a.earned
        );
      }

      return achievements;
    }, [selectedTab]);

  /* ================= RARITY COLORS ================= */

  const rarityColor = (rarity) => {
    switch (rarity) {
      case "Common":
        return "text-slate-400";

      case "Rare":
        return "text-blue-400";

      case "Epic":
        return "text-purple-400";

      case "Legendary":
        return "text-yellow-400";

      case "Mythic":
        return "text-pink-400";

      default:
        return "text-indigo-400";
    }
  };

  return (
    <div
      className={`min-h-screen relative overflow-hidden ${bg}`}
    >
      {/* BACKGROUND */}

      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 blur-3xl rounded-full" />

      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 blur-3xl rounded-full" />

      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        {/* HERO */}

        <div
          className={`relative overflow-hidden rounded-[35px] p-6 md:p-10 mb-8 ${card}`}
        >
          <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 blur-3xl rounded-full" />

          <div className="relative z-10 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">
            {/* LEFT */}

            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 text-indigo-400 text-sm font-semibold mb-5">
                <Award size={16} />
                Achievement System
              </div>

              <h1 className="text-4xl md:text-6xl font-black leading-tight">
                Your
                <span className="bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
                  {" "}
                  Achievements
                </span>
              </h1>

              <p
                className={`mt-4 max-w-2xl leading-relaxed ${softText}`}
              >
                Unlock badges, earn XP,
                maintain study streaks and
                dominate the leaderboard.
              </p>

              {/* XP BAR */}

              <div className="mt-8 max-w-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold">
                    Level Progress
                  </span>

                  <span
                    className={`text-sm ${softText}`}
                  >
                    {progress}%
                  </span>
                </div>

                <div
                  className={`h-4 rounded-full overflow-hidden ${dark ? "bg-white/10" : "bg-slate-200"}`}
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-1000"
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* RIGHT STATS */}

            <div className="grid grid-cols-2 gap-4 w-full xl:w-[400px]">
              {[
                {
                  title: "Total XP",
                  value:
                    stats.totalXP.toLocaleString(),
                  icon: (
                    <Sparkles size={22} />
                  ),
                  color:
                    "from-indigo-500 to-blue-600",
                },

                {
                  title: "Streak",
                  value: `${stats.streak} Days`,
                  icon: (
                    <Flame size={22} />
                  ),
                  color:
                    "from-orange-500 to-red-500",
                },

                {
                  title: "Global Rank",
                  value: stats.rank,
                  icon: (
                    <Trophy size={22} />
                  ),
                  color:
                    "from-yellow-400 to-orange-500",
                },

                {
                  title: "Completed",
                  value: `${stats.completed}/${stats.total}`,
                  icon: (
                    <CheckCircle2 size={22} />
                  ),
                  color:
                    "from-green-500 to-emerald-600",
                },
              ].map(
                (item, index) => (
                  <div
                    key={index}
                    className={`${card} rounded-3xl p-5`}
                  >
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white mb-5`}
                    >
                      {item.icon}
                    </div>

                    <p
                      className={`text-sm ${softText}`}
                    >
                      {item.title}
                    </p>

                    <h3 className="text-2xl font-black mt-2">
                      {item.value}
                    </h3>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* FILTERS */}

        <div className="flex flex-wrap gap-3 mb-8">
          {[
            "all",
            "earned",
            "locked",
          ].map((tab) => (
            <button
              key={tab}
              onClick={() =>
                setSelectedTab(tab)
              }
              className={`h-12 px-6 rounded-2xl font-semibold capitalize transition-all
              ${
                selectedTab === tab
                  ? "bg-indigo-500 text-white shadow-xl shadow-indigo-500/20"
                  : dark
                  ? "bg-white/5 border border-white/10 hover:bg-white/10"
                  : "bg-white border border-slate-200 hover:bg-slate-100"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ACHIEVEMENTS */}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAchievements.map(
            (achievement) => (
              <div
                key={achievement.id}
                className={`relative overflow-hidden rounded-[32px] p-6 transition-all duration-300 hover:scale-[1.02] ${card}`}
              >
                {/* GLOW */}

                <div
                  className={`absolute inset-0 opacity-10 bg-gradient-to-br ${achievement.color}`}
                />

                {/* TOP */}

                <div className="relative z-10">
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className={`w-16 h-16 rounded-3xl bg-gradient-to-br ${achievement.color} flex items-center justify-center text-white shadow-xl`}
                    >
                      {achievement.icon}
                    </div>

                    <div className="flex items-center gap-2">
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-bold ${rarityColor(
                          achievement.rarity
                        )} ${
                          dark
                            ? "bg-white/5"
                            : "bg-slate-100"
                        }`}
                      >
                        {
                          achievement.rarity
                        }
                      </div>

                      {achievement.earned ? (
                        <BadgeCheck className="text-green-400" />
                      ) : (
                        <Lock
                          className={softText}
                        />
                      )}
                    </div>
                  </div>

                  {/* CONTENT */}

                  <div className="mt-6">
                    <h2 className="text-2xl font-black leading-tight">
                      {achievement.title}
                    </h2>

                    <p
                      className={`mt-3 leading-relaxed ${softText}`}
                    >
                      {
                        achievement.description
                      }
                    </p>
                  </div>

                  {/* PROGRESS */}

                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-sm font-medium ${softText}`}
                      >
                        Progress
                      </span>

                      <span className="text-sm font-bold">
                        {
                          achievement.progress
                        }
                        %
                      </span>
                    </div>

                    <div
                      className={`h-3 rounded-full overflow-hidden ${dark ? "bg-white/10" : "bg-slate-200"}`}
                    >
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${achievement.color}`}
                        style={{
                          width: `${achievement.progress}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* FOOTER */}

                  <div className="mt-7 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-yellow-400">
                      <Star size={18} />
                      <span className="font-bold">
                        {achievement.xp} XP
                      </span>
                    </div>

                    {achievement.earned ? (
                      <div className="flex items-center gap-2 text-green-400 text-sm font-semibold">
                        <CheckCircle2 size={16} />
                        Unlocked
                      </div>
                    ) : (
                      <div
                        className={`text-sm font-semibold ${softText}`}
                      >
                        Locked
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          )}
        </div>

        {/* BADGE SECTION */}

        <div className="mt-10">
          <div
            className={`rounded-[35px] p-6 md:p-8 ${card}`}
          >
            <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
              <div>
                <h2 className="text-3xl font-black">
                  Special Badges
                </h2>

                <p
                  className={`mt-2 ${softText}`}
                >
                  Exclusive rewards for
                  elite learners.
                </p>
              </div>

              <Medal className="text-yellow-400" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
              {[
                {
                  title:
                    "Top Scorer",
                  icon: (
                    <Trophy size={28} />
                  ),
                  color:
                    "from-yellow-400 to-orange-500",
                },

                {
                  title:
                    "Study King",
                  icon: (
                    <Crown size={28} />
                  ),
                  color:
                    "from-purple-500 to-pink-500",
                },

                {
                  title:
                    "AI Pro",
                  icon: (
                    <BrainCircuit size={28} />
                  ),
                  color:
                    "from-indigo-500 to-blue-600",
                },

                {
                  title:
                    "Consistency",
                  icon: (
                    <CalendarDays size={28} />
                  ),
                  color:
                    "from-green-500 to-emerald-600",
                },

                {
                  title:
                    "Elite Learner",
                  icon: (
                    <Rocket size={28} />
                  ),
                  color:
                    "from-cyan-500 to-sky-600",
                },
              ].map(
                (badge, index) => (
                  <div
                    key={index}
                    className={`relative overflow-hidden rounded-3xl p-5 text-center transition-all duration-300 hover:scale-[1.03] ${card}`}
                  >
                    <div
                      className={`absolute inset-0 opacity-10 bg-gradient-to-br ${badge.color}`}
                    />

                    <div className="relative z-10">
                      <div
                        className={`w-16 h-16 rounded-3xl bg-gradient-to-br ${badge.color} flex items-center justify-center text-white mx-auto mb-5`}
                      >
                        {badge.icon}
                      </div>

                      <h3 className="font-black leading-tight">
                        {badge.title}
                      </h3>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Achievements;