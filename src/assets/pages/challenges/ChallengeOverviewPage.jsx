import React from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  Globe,
  Layers,
  Library,
  Lightbulb,
  Sparkles,
  Timer,
  Trophy,
  Users,
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

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

const prettyName = (value) => (value || "daily").replace(/-/g, " ");

const getTone = (id) => ({
  accent: CATEGORY_TONES[id]?.accent || colors.violet,
  tint: CATEGORY_TONES[id]?.tint || "rgba(108,92,231,0.12)",
});

export default function ChallengeOverviewPage({
  theme,
  stats,
  history,
  handleStartQuiz,
  getRankColor,
  getStatusColor,
  challengeCategories = [],
}) {
  const daily = challengeCategories.find((c) => c.id === "daily");
  const quickPicks = challengeCategories.filter(
    (c) => FEATURED_IDS.includes(c.id) && c.id !== "daily"
  );
  const others = challengeCategories.filter(
    (c) => !FEATURED_IDS.includes(c.id)
  );
  const recent = (history || []).slice(0, 5);

  const today = new Date().toISOString().slice(0, 10);
  const doneToday = !!stats?.streakDates?.includes(today);
  const rank = stats?.rank || "Bronze";

  const dailyTone = getTone("daily");
  const DailyIcon = ICONS[daily?.icon] || Calendar;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* ============================================= */}
      {/* MAIN COLUMN */}
      {/* ============================================= */}
      <div className="lg:col-span-2 space-y-8">
        {/* TODAY: the one primary action on the page */}
        {daily && (
          <section
            aria-label="Today's challenge"
            className={`relative overflow-hidden rounded-3xl p-6 md:p-7 ${theme.card}`}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-12 -right-12 h-44 w-44 rounded-full blur-2xl opacity-70"
              style={{ background: dailyTone.tint }}
            />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4 min-w-0">
                <span
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
                  style={{ background: dailyTone.tint, color: dailyTone.accent }}
                >
                  <DailyIcon size={22} />
                </span>
                <div className="min-w-0">
                  <p
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                      doneToday ? "text-emerald-500" : "text-orange-500"
                    }`}
                  >
                    {doneToday ? (
                      <>
                        <CheckCircle2 size={14} />
                        Done for today
                      </>
                    ) : (
                      <>
                        <Flame size={14} />
                        Not played yet today
                      </>
                    )}
                  </p>
                  <h2 className="mt-1 text-xl md:text-2xl font-black leading-tight">
                    {daily.title}
                  </h2>
                  <p className={`mt-1 text-sm max-w-md ${theme.textSoft}`}>
                    {doneToday
                      ? "Your streak is safe. Come back tomorrow, or play again for extra practice."
                      : daily.subtitle ||
                        "One quick challenge keeps your streak going."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleStartQuiz(daily)}
                className={`inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl px-6 text-sm font-black text-white transition hover:brightness-110 ${FOCUS_RING}`}
                style={{ background: dailyTone.accent }}
              >
                {doneToday ? "Play again" : "Start today's challenge"}
                <ArrowRight size={16} />
              </button>
            </div>
          </section>
        )}

        {/* QUICK PICKS */}
        {quickPicks.length > 0 && (
          <section aria-labelledby="quick-picks-heading">
            <div className="flex items-center justify-between mb-3">
              <h2
                id="quick-picks-heading"
                className="text-base font-black flex items-center gap-2"
              >
                <Sparkles size={16} className="text-indigo-500" />
                Popular challenges
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {quickPicks.map((cat) => {
                const Icon = ICONS[cat.icon] || Sparkles;
                const { accent, tint } = getTone(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleStartQuiz(cat)}
                    className={`group relative overflow-hidden rounded-3xl border p-5 text-left transition motion-safe:hover:-translate-y-0.5 ${theme.cardHover} ${theme.card} ${FOCUS_RING}`}
                  >
                    <div className="flex items-start gap-4">
                      <span
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                        style={{ background: tint, color: accent }}
                      >
                        <Icon size={19} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-base leading-tight">
                          {cat.title}
                        </h3>
                        <p
                          className={`mt-1 text-sm line-clamp-2 ${theme.textSoft}`}
                        >
                          {cat.subtitle}
                        </p>
                      </div>
                      <ArrowUpRight
                        size={16}
                        className="shrink-0 opacity-40 transition group-hover:opacity-100"
                        style={{ color: accent }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* MORE CHALLENGES (previously unreachable from this page) */}
        {others.length > 0 && (
          <section aria-labelledby="more-heading">
            <h2 id="more-heading" className="text-base font-black mb-3">
              More challenges
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {others.map((cat) => {
                const Icon = ICONS[cat.icon] || Sparkles;
                const { accent, tint } = getTone(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleStartQuiz(cat)}
                    className={`group flex items-center gap-3 rounded-2xl border p-3.5 text-left transition ${theme.cardHover} ${theme.card} ${FOCUS_RING}`}
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: tint, color: accent }}
                    >
                      <Icon size={17} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">
                        {cat.title}
                      </span>
                      <span
                        className={`block truncate text-xs ${theme.textSoft}`}
                      >
                        {cat.subtitle}
                      </span>
                    </span>
                    <ArrowRight
                      size={15}
                      className="shrink-0 opacity-30 transition group-hover:opacity-80"
                    />
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* RECENT ACTIVITY */}
        <section aria-labelledby="recent-heading">
          <div className="flex items-center justify-between mb-3">
            <h2
              id="recent-heading"
              className="text-base font-black flex items-center gap-2"
            >
              <Clock size={16} className="text-indigo-500" />
              Recent activity
            </h2>
            {recent.length > 0 && (
              <span className={`text-xs ${theme.textSoft}`}>
                Your last {recent.length}{" "}
                {recent.length === 1 ? "attempt" : "attempts"}
              </span>
            )}
          </div>

          <div className={`${theme.card} rounded-3xl overflow-hidden`}>
            {recent.length === 0 ? (
              <div className="p-8 text-center">
                <Trophy className="mx-auto mb-3 opacity-40" size={30} />
                <p className="text-sm font-bold">No attempts yet</p>
                <p className={`mt-1 text-xs ${theme.textSoft}`}>
                  Finish a challenge and it will show up here, with your score
                  and time.
                </p>
              </div>
            ) : (
              <ul className={`divide-y ${theme.ledgerLine}`}>
                {recent.map((item) => {
                  const accuracy = Math.max(
                    0,
                    Math.min(100, Number(item.accuracy) || 0)
                  );
                  return (
                    <li key={item.id} className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-sm font-bold capitalize truncate">
                            {prettyName(item.category)}
                          </p>
                          <p className={`text-xs ${theme.textSoft}`}>
                            {item.score}/{item.totalQuestions} correct
                            {item.durationSeconds
                              ? ` · ${item.durationSeconds}s`
                              : ""}
                          </p>
                        </div>
                        <p
                          className={`text-base font-black tabular-nums shrink-0 ${getStatusColor(
                            accuracy
                          )}`}
                        >
                          {accuracy}%
                        </p>
                      </div>

                      {/* accuracy bar uses the same color as the percentage */}
                      <div
                        className={`mt-2.5 h-1.5 w-full overflow-hidden rounded-full ${theme.soft}`}
                        role="progressbar"
                        aria-valuenow={accuracy}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Accuracy ${accuracy} percent`}
                      >
                        <div
                          className={`h-full rounded-full bg-current ${getStatusColor(
                            accuracy
                          )}`}
                          style={{ width: `${accuracy}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </div>

      {/* ============================================= */}
      {/* SIDEBAR */}
      {/* ============================================= */}
      <aside className="space-y-6">
        <section
          aria-labelledby="standing-heading"
          className={`${theme.card} rounded-3xl p-6`}
        >
          <h2 id="standing-heading" className="text-base font-black mb-4">
            Your standing
          </h2>

          <div
            className={`flex items-center justify-between rounded-2xl p-4 mb-4 ${theme.soft}`}
          >
            <div>
              <p className={`text-xs ${theme.textSoft}`}>Current tier</p>
              <p className="text-lg font-black">{rank}</p>
            </div>
            <span
              className="px-3 py-1 rounded-full text-xs font-bold text-[#12182B]"
              style={{ background: getRankColor(stats?.rank) }}
            >
              {rank}
            </span>
          </div>

          <dl className="grid grid-cols-3 gap-2.5">
            {[
              { label: "Total points", value: stats?.totalPoints || 0 },
              { label: "Best streak", value: stats?.longestStreak || 0 },
              { label: "Answered", value: stats?.questionsAnswered || 0 },
            ].map((row) => (
              <div
                key={row.label}
                className={`rounded-2xl p-3 text-center ${theme.soft}`}
              >
                <dd className="text-lg font-black tabular-nums leading-tight">
                  {row.value}
                </dd>
                <dt className={`mt-1 text-[11px] leading-tight ${theme.textSoft}`}>
                  {row.label}
                </dt>
              </div>
            ))}
          </dl>
        </section>

        <section
          aria-labelledby="streak-heading"
          className={`${theme.card} rounded-3xl p-6`}
        >
          <h2
            id="streak-heading"
            className="text-base font-black mb-2 flex items-center gap-2"
          >
            <Flame
              size={16}
              className={doneToday ? "text-emerald-500" : "text-orange-500"}
            />
            Streak
          </h2>
          <p className={`text-sm leading-6 ${theme.textSoft}`}>
            {doneToday
              ? "You've played today. Come back tomorrow to keep your streak alive."
              : "You haven't played today. One challenge keeps your streak going."}
          </p>
        </section>
      </aside>
    </div>
  );
}