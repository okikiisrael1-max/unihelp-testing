import React, { useEffect, useMemo, useState } from "react";
import {
  Medal,
  Trophy,
  Search,
  MoreVertical,
  X,
  Flame,
  Target,
  BookOpen,
  Zap,
  Award,
  TrendingUp,
  TrendingDown,
  Crown,
} from "lucide-react";

const SCOPES = [
  { id: "global", label: "Global" },
  { id: "university", label: "My University" },
  { id: "department", label: "My Department" },
  { id: "friends", label: "Friends" },
];

const PERIODS = [
  { id: "today", label: "Today" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
  { id: "all", label: "All Time" },
];

const RANK_EMOJIS = ["🥇", "🥈", "🥉"];

const ACHIEVEMENT_ICONS = {
  streak: Flame,
  champion: Trophy,
  fast: Zap,
  problem: Target,
  scholar: BookOpen,
};

function getAchievementMeta(badge) {
  const id = typeof badge === "string" ? badge : badge?.id;
  const label =
    typeof badge === "string" ? badge : badge?.label || badge?.id || "Achievement";
  const Icon = ACHIEVEMENT_ICONS[id] || Award;
  return { label, Icon };
}

export default function ChallengeLeaderboardPage({
  theme = {},
  leaderboard = [],
  leaderboardScope,
  setLeaderboardScope,
  fetchLeaderboard,
  getRankColor = () => "#CBD5E1",
  currentUserId,
}) {
  const [period, setPeriod] = useState("all");
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Apply fallback classes if theme prop keys are undefined
  const cardBg = theme.card || "bg-white dark:bg-slate-900";
  const softBg = theme.soft || "bg-slate-100 dark:bg-slate-800";
  const textSoft = theme.textSoft || "text-slate-500 dark:text-slate-400";
  const ledgerLine = theme.ledgerLine || "divide-slate-200/60 dark:divide-slate-800";

  useEffect(() => {
    if (!fetchLeaderboard) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    Promise.resolve(fetchLeaderboard(leaderboardScope, period))
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [leaderboardScope, period, fetchLeaderboard]);

  const currentUserRow = useMemo(
    () => leaderboard.find((row) => row.id === currentUserId) || null,
    [leaderboard, currentUserId]
  );

  const searchTerm = search.trim().toLowerCase();
  const isSearching = searchTerm.length > 0;

  const filteredLeaderboard = useMemo(() => {
    if (!isSearching) return leaderboard;
    return leaderboard.filter((row) =>
      [row.name, row.university, row.department]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(searchTerm)
    );
  }, [leaderboard, isSearching, searchTerm]);

  const podium = !isSearching ? leaderboard.slice(0, 3) : [];
  const restList = !isSearching ? leaderboard.slice(3) : filteredLeaderboard;
  const showStickyRank = Boolean(currentUserRow && currentUserRow.position > 3);

  const retry = () => {
    setError(null);
    setIsLoading(true);
    return fetchLeaderboard?.(leaderboardScope, period);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-28 sm:pb-24">
      {/* ── HEADER ── */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Trophy size={26} className="text-amber-500" />
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Leaderboard</h1>
            </div>
            <p className={`text-sm mt-1 ${textSoft}`}>
              Compete, earn XP, and track your rank.
            </p>
          </div>

          <button
            onClick={() => {
              setSearchOpen((v) => !v);
              if (searchOpen) setSearch("");
            }}
            aria-label="Toggle search"
            className={`h-11 w-11 flex items-center justify-center rounded-2xl shrink-0 transition-all ${cardBg} border border-slate-200/60 dark:border-slate-800 ${
              searchOpen ? "text-indigo-500 ring-2 ring-indigo-500/20" : textSoft
            }`}
          >
            <Search size={18} />
          </button>
        </div>

        {currentUserRow && (
          <div
            className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4 ${cardBg} border border-indigo-500/20 shadow-sm shadow-indigo-500/5`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 font-black flex items-center justify-center text-sm">
                #{currentUserRow.position || "—"}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-indigo-500">Your Rank</p>
                <p className="text-sm font-semibold truncate">You ({currentUserRow.name || "Student"})</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className={`text-[11px] font-medium uppercase tracking-wider ${textSoft}`}>
                  Total XP
                </p>
                <p className="text-base font-black tabular-nums text-indigo-500">
                  {currentUserRow.xp?.toLocaleString() || 0}
                </p>
              </div>

              {typeof currentUserRow.change === "number" && currentUserRow.change !== 0 && (
                <span
                  className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                    currentUserRow.change > 0
                      ? "text-emerald-600 bg-emerald-500/10"
                      : "text-rose-600 bg-rose-500/10"
                  }`}
                >
                  {currentUserRow.change > 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  {Math.abs(currentUserRow.change)}
                </span>
              )}
            </div>
          </div>
        )}

        {searchOpen && (
          <div className={`mt-3 flex items-center gap-3 rounded-2xl px-4 py-3 ${cardBg} border border-slate-200/80 dark:border-slate-800 shadow-sm`}>
            <Search size={16} className={textSoft} />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student, university, or department..."
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-slate-400"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X size={15} className={textSoft} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── FILTERS ── */}
      <div className="mb-6">
        {/* Desktop / Tablet Filters */}
        <div className="hidden sm:flex items-center justify-between gap-4 flex-wrap">
          <div className="flex flex-wrap gap-1.5 p-1 rounded-2xl bg-slate-200/50 dark:bg-slate-800/60">
            {SCOPES.map((s) => (
              <button
                key={s.id}
                onClick={() => setLeaderboardScope?.(s.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  leaderboardScope === s.id
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : `${textSoft} hover:text-slate-900 dark:hover:text-white`
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1 p-1 rounded-2xl bg-slate-200/50 dark:bg-slate-800/60">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  period === p.id
                    ? "bg-indigo-500 text-white shadow-sm"
                    : `${textSoft} hover:text-slate-900 dark:hover:text-white`
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Filter Row */}
        <div className="flex sm:hidden items-center justify-between gap-2">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
            {SCOPES.map((s) => (
              <button
                key={s.id}
                onClick={() => setLeaderboardScope?.(s.id)}
                className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  leaderboardScope === s.id
                    ? "bg-indigo-500 text-white shadow-sm"
                    : `${cardBg} ${textSoft} border border-slate-200/60 dark:border-slate-800`
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setFiltersOpen(true)}
            aria-label="More filters"
            className={`h-9 w-9 shrink-0 flex items-center justify-center rounded-xl border border-slate-200/60 dark:border-slate-800 ${cardBg} ${textSoft}`}
          >
            <MoreVertical size={16} />
          </button>
        </div>
      </div>

      {/* ── LEADERBOARD CONTAINER ── */}
      <div className={`${cardBg} rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden`}>
        {isLoading ? (
          <div className="p-6">
            <div className="grid grid-cols-3 gap-3 items-end mb-8">
              {[1, 0, 2].map((idx) => (
                <div key={idx} className={`rounded-2xl p-4 animate-pulse ${softBg} ${idx === 0 ? "h-44" : "h-36"}`} />
              ))}
            </div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className={`h-14 rounded-2xl animate-pulse ${softBg}`} />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <Trophy size={40} className="mx-auto text-slate-300 dark:text-slate-700 mb-3" />
            <p className="font-bold text-base mb-1">Failed to load leaderboard</p>
            <p className={`text-xs mb-4 ${textSoft}`}>There was a problem fetching the dynamic rankings.</p>
            <button
              onClick={retry}
              className="px-5 py-2.5 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold shadow-md transition"
            >
              Try Again
            </button>
          </div>
        ) : filteredLeaderboard.length === 0 ? (
          <div className="p-12 text-center">
            <Trophy size={40} className="mx-auto text-slate-300 dark:text-slate-700 mb-3" />
            <p className="font-bold text-base mb-1">
              {isSearching ? "No matching students found" : "No rankings available"}
            </p>
            <p className={`text-xs ${textSoft}`}>
              {isSearching ? "Try broadening your search query." : "Earn XP to be the first on this board!"}
            </p>
          </div>
        ) : (
          <>
            {podium.length > 0 && (
              <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800/60 bg-gradient-to-b from-slate-50/50 to-transparent dark:from-slate-900/40">
                <Podium
                  students={podium}
                  theme={theme}
                  getRankColor={getRankColor}
                  currentUserId={currentUserId}
                  onSelect={setSelectedStudent}
                />
              </div>
            )}

            <div className={`divide-y ${ledgerLine}`}>
              {restList.map((row) => (
                <RankRow
                  key={row.id}
                  row={row}
                  theme={theme}
                  getRankColor={getRankColor}
                  isMe={row.id === currentUserId}
                  onSelect={setSelectedStudent}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── STICKY "YOUR RANK" BOTTOM BAR ── */}
      {showStickyRank && (
        <div className="fixed bottom-4 inset-x-4 sm:max-w-md sm:mx-auto z-40">
          <button
            onClick={() => setSelectedStudent(currentUserRow)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border border-indigo-500/30 backdrop-blur-md bg-white/90 dark:bg-slate-900/90 transition hover:scale-[1.01]`}
          >
            <span className="text-sm font-black text-indigo-500 shrink-0">#{currentUserRow.position}</span>
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden text-xs font-bold text-slate-700 dark:text-slate-200 shrink-0">
              {currentUserRow.avatar ? (
                <img src={currentUserRow.avatar} className="w-full h-full object-cover" alt="You" />
              ) : (
                "Y"
              )}
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-xs font-bold truncate">Your Position</p>
              <p className={`text-xs ${textSoft}`}>{currentUserRow.xp?.toLocaleString() || 0} XP</p>
            </div>
            <span className="text-xs font-bold text-indigo-500 hover:underline">View Profile</span>
          </button>
        </div>
      )}

      {/* ── MOBILE FILTERS BOTTOM SHEET ── */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:hidden">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setFiltersOpen(false)} />
          <div className={`relative z-10 w-full rounded-t-3xl p-6 ${cardBg} border-t border-slate-200/80 dark:border-slate-800`}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-lg">Filter Leaderboard</h3>
              <button
                onClick={() => setFiltersOpen(false)}
                aria-label="Close filters"
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <p className={`text-xs font-bold uppercase tracking-wider mb-2.5 ${textSoft}`}>Scope</p>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {SCOPES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setLeaderboardScope?.(s.id)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                    leaderboardScope === s.id
                      ? "bg-indigo-500 text-white"
                      : `${softBg} ${textSoft}`
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <p className={`text-xs font-bold uppercase tracking-wider mb-2.5 ${textSoft}`}>Time period</p>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {PERIODS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPeriod(p.id)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                    period === p.id ? "bg-indigo-500 text-white" : `${softBg} ${textSoft}`
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setFiltersOpen(false)}
              className="w-full py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm shadow-md"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* ── PROFILE MODAL ── */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setSelectedStudent(null)} />
          <div className={`relative z-10 w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-6 ${cardBg} border border-slate-200/80 dark:border-slate-800 shadow-2xl`}>
            <button
              onClick={() => setSelectedStudent(null)}
              aria-label="Close profile"
              className={`absolute top-4 right-4 p-2 rounded-full ${softBg}`}
            >
              <X size={16} />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden text-2xl font-bold text-slate-700 dark:text-slate-200 mb-3 shadow-inner">
                {selectedStudent.avatar ? (
                  <img
                    src={selectedStudent.avatar}
                    className="w-full h-full object-cover"
                    alt={selectedStudent.name || "Avatar"}
                  />
                ) : (
                  (selectedStudent.name || "S")[0]
                )}
              </div>

              <h3 className="text-lg font-black tracking-tight">
                {selectedStudent.name || "Student"}
                {selectedStudent.id === currentUserId && <span className="text-indigo-500"> (You)</span>}
              </h3>

              {(selectedStudent.university || selectedStudent.department) && (
                <p className={`text-xs mt-0.5 ${textSoft}`}>
                  {[selectedStudent.university, selectedStudent.department].filter(Boolean).join(" • ")}
                </p>
              )}

              <div className="flex items-center gap-2 mt-3 flex-wrap justify-center">
                <span
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-slate-900 shadow-xs"
                  style={{ background: getRankColor(selectedStudent.rank) }}
                >
                  <Medal size={13} /> {selectedStudent.rank || "Bronze"}
                </span>
                {selectedStudent.level && (
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${softBg}`}>
                    Level {selectedStudent.level}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 w-full mt-5">
                <div className={`rounded-2xl p-3 ${softBg} border border-slate-200/40 dark:border-slate-800`}>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${textSoft}`}>Rank</p>
                  <p className="text-lg font-black">#{selectedStudent.position || "—"}</p>
                </div>
                <div className={`rounded-2xl p-3 ${softBg} border border-slate-200/40 dark:border-slate-800`}>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${textSoft}`}>XP</p>
                  <p className="text-lg font-black">{selectedStudent.xp?.toLocaleString() || 0}</p>
                </div>
              </div>

              {Array.isArray(selectedStudent.achievements) && selectedStudent.achievements.length > 0 && (
                <div className="w-full mt-5 text-left">
                  <p className={`text-[11px] font-bold uppercase tracking-wider mb-2.5 ${textSoft}`}>
                    Achievements
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedStudent.achievements.map((b, i) => {
                      const { Icon, label } = getAchievementMeta(b);
                      return (
                        <span
                          key={`${label}-${i}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-500/10 text-indigo-500"
                        >
                          <Icon size={14} /> {label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ======================================================
// PODIUM
// ======================================================

function PodiumCard({ place, row, theme, getRankColor, isMe, onSelect }) {
  if (!row) {
    return <div className="flex-1 opacity-0 pointer-events-none" />;
  }

  const isFirst = place === 1;
  const softBg = theme.soft || "bg-slate-100 dark:bg-slate-800";
  const textSoft = theme.textSoft || "text-slate-500 dark:text-slate-400";

  return (
    <button
      onClick={() => onSelect(row)}
      className={`relative flex flex-col items-center text-center rounded-3xl p-3 sm:p-5 transition hover:-translate-y-1 ${softBg} border border-slate-200/60 dark:border-slate-800 ${
        place === 2 ? "mt-4 sm:mt-6" : place === 3 ? "mt-8 sm:mt-10" : ""
      } ${isMe ? "ring-2 ring-indigo-500/80 shadow-md" : ""}`}
    >
      <div className="relative mb-2 sm:mb-3">
        <div
          className={`rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-black text-slate-700 dark:text-slate-200 shadow-sm ${
            isFirst ? "w-16 h-16 sm:w-20 sm:h-20 text-xl sm:text-2xl" : "w-12 h-12 sm:w-14 sm:h-14 text-base sm:text-lg"
          }`}
        >
          {row.avatar ? (
            <img src={row.avatar} alt={row.name || "Avatar"} className="w-full h-full object-cover" />
          ) : (
            (row.name || "S")[0]
          )}
        </div>
        <span className="absolute -bottom-1 -right-1 text-lg sm:text-xl leading-none select-none">
          {RANK_EMOJIS[place - 1]}
        </span>
        {isFirst && (
          <Crown
            size={20}
            className="absolute -top-4 left-1/2 -translate-x-1/2 text-amber-400 drop-shadow-sm"
            fill="currentColor"
          />
        )}
      </div>

      <p className={`font-black truncate max-w-full ${isFirst ? "text-sm sm:text-base" : "text-xs sm:text-sm"}`}>
        {row.name || "Student"}
      </p>

      {row.university && (
        <p className={`text-[10px] sm:text-xs truncate max-w-full ${textSoft}`}>
          {row.university}
        </p>
      )}

      <p className={`font-black tabular-nums mt-1 ${isFirst ? "text-base sm:text-lg text-indigo-500" : "text-xs sm:text-sm text-slate-700 dark:text-slate-200"}`}>
        {row.xp?.toLocaleString() || 0} XP
      </p>

      {row.rank && (
        <span
          className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold text-slate-900"
          style={{ background: getRankColor(row.rank) }}
        >
          <Medal size={10} /> {row.rank}
        </span>
      )}
    </button>
  );
}

function Podium({ students, theme, getRankColor, currentUserId, onSelect }) {
  const [first, second, third] = students;
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end max-w-lg mx-auto">
      <PodiumCard place={2} row={second} theme={theme} getRankColor={getRankColor} isMe={second?.id === currentUserId} onSelect={onSelect} />
      <PodiumCard place={1} row={first} theme={theme} getRankColor={getRankColor} isMe={first?.id === currentUserId} onSelect={onSelect} />
      <PodiumCard place={3} row={third} theme={theme} getRankColor={getRankColor} isMe={third?.id === currentUserId} onSelect={onSelect} />
    </div>
  );
}

// ======================================================
// RANKING ROW
// ======================================================

function RankRow({ row, theme, getRankColor, isMe, onSelect }) {
  const hasChange = typeof row.change === "number" && row.change !== 0;
  const textSoft = theme.textSoft || "text-slate-500 dark:text-slate-400";

  return (
    <button
      onClick={() => onSelect(row)}
      className={`w-full grid grid-cols-[2rem_auto_1fr_auto] sm:grid-cols-[2.5rem_auto_1fr_auto_auto] items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3.5 text-left transition ${
        isMe ? "bg-indigo-500/10 dark:bg-indigo-500/15" : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
      }`}
    >
      <span className={`text-xs sm:text-sm font-black tabular-nums ${textSoft}`}>
        #{row.position}
      </span>

      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden text-xs font-bold text-slate-700 dark:text-slate-200 shrink-0 shadow-xs">
        {row.avatar ? (
          <img src={row.avatar} alt={row.name || "Avatar"} className="w-full h-full object-cover" />
        ) : (
          (row.name || "S")[0]
        )}
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-xs sm:text-sm font-bold truncate">
            {row.name || "Student"}
            {isMe && <span className="text-indigo-500 font-semibold"> (You)</span>}
          </p>
          {Array.isArray(row.achievements) &&
            row.achievements.slice(0, 2).map((b, i) => {
              const { Icon, label } = getAchievementMeta(b);
              return <Icon key={`${label}-${i}`} size={12} className="text-indigo-500 shrink-0" aria-label={label} />;
            })}
        </div>
        <p className={`text-[11px] sm:text-xs truncate ${textSoft}`}>
          {[row.university || row.department || "—", row.level ? `Lvl ${row.level}` : null]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>

      <span
        className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-slate-900 shrink-0 justify-self-end shadow-xs"
        style={{ background: getRankColor(row.rank) }}
      >
        <Medal size={11} /> {row.rank || "Bronze"}
      </span>

      <div className="flex items-center gap-2 justify-self-end">
        {hasChange && (
          <span
            className={`flex items-center gap-0.5 text-[11px] font-bold ${
              row.change > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {row.change > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(row.change)}
          </span>
        )}
        <span className="text-xs sm:text-sm font-black tabular-nums text-right text-indigo-500">
          {row.xp?.toLocaleString() || 0}
        </span>
      </div>
    </button>
  );
}