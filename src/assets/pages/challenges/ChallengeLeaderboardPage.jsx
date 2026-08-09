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

// Maps known achievement ids to an icon. Falls back to a generic Award icon
// for any badge id/shape we don't explicitly recognize, so unexpected data
// never breaks rendering.
const ACHIEVEMENT_ICONS = {
  streak: Flame,
  champion: Trophy,
  fast: Zap,
  problem: Target,
  scholar: BookOpen,
};

function getAchievementMeta(badge) {
  const id = typeof badge === "string" ? badge : badge?.id;
  const label = typeof badge === "string" ? badge : badge?.label || badge?.id || "Achievement";
  const Icon = ACHIEVEMENT_ICONS[id] || Award;
  return { label, Icon };
}

export default function ChallengeLeaderboardPage({
  theme,
  leaderboard,
  leaderboardScope,
  setLeaderboardScope,
  fetchLeaderboard,
  getRankColor,
  currentUserId,
}) {
  const [period, setPeriod] = useState("all");
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false); // mobile bottom sheet
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // fetchLeaderboard is an existing prop — we just also pass `period` along
  // now (a no-op if the caller doesn't use it yet) and track loading/error
  // locally since no such state was previously exposed to this component.
  useEffect(() => {
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
      [row.name, row.university, row.department].filter(Boolean).join(" ").toLowerCase().includes(searchTerm)
    );
  }, [leaderboard, isSearching, searchTerm]);

  const podium = !isSearching ? leaderboard.slice(0, 3) : [];
  const restList = !isSearching ? leaderboard.slice(3) : filteredLeaderboard;
  const showStickyRank = Boolean(currentUserRow && currentUserRow.position > 3);

  const retry = () => fetchLeaderboard(leaderboardScope, period);

  return (
    <div className="pb-24">
      {/* ── HEADER ── */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Trophy size={22} className="text-indigo-500" />
              <h1 className="text-2xl font-black">Leaderboard</h1>
            </div>
            <p className={`text-sm mt-1 ${theme.textSoft}`}>See how you rank against other students.</p>
          </div>

          <button
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Search students"
            className={`h-10 w-10 flex items-center justify-center rounded-full shrink-0 transition ${theme.card} ${
              searchOpen ? "text-indigo-500" : theme.textSoft
            }`}
          >
            <Search size={16} />
          </button>
        </div>

        {currentUserRow && (
          <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl px-4 py-3 ${theme.card} ring-1 ring-indigo-500/20`}>
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-wide font-semibold text-indigo-500">Your rank</span>
              <span className="text-lg font-black">#{currentUserRow.position}</span>
            </div>
            <div className={`hidden sm:block h-4 w-px ${theme.soft}`} />
            <div className="flex items-center gap-2">
              <span className={`text-[11px] uppercase tracking-wide font-semibold ${theme.textSoft}`}>XP</span>
              <span className="text-lg font-black">{currentUserRow.xp || 0}</span>
            </div>
            {typeof currentUserRow.change === "number" && currentUserRow.change !== 0 && (
              <>
                <div className={`hidden sm:block h-4 w-px ${theme.soft}`} />
                <span
                  className={`flex items-center gap-1 text-sm font-bold ${
                    currentUserRow.change > 0 ? "text-emerald-500" : "text-red-500"
                  }`}
                >
                  {currentUserRow.change > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {Math.abs(currentUserRow.change)}
                </span>
              </>
            )}
          </div>
        )}

        {searchOpen && (
          <div className={`mt-3 flex items-center gap-2 rounded-2xl px-4 py-2.5 ${theme.card}`}>
            <Search size={15} className={theme.textSoft} />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or university..."
              className="flex-1 bg-transparent outline-none text-sm"
            />
            {search && (
              <button onClick={() => setSearch("")} aria-label="Clear search">
                <X size={14} className={theme.textSoft} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── FILTERS ── */}
      <div className="mb-5">
        {/* Desktop / tablet — everything visible */}
        <div className="hidden sm:flex items-center justify-between gap-3 flex-wrap">
          <div className="flex flex-wrap gap-2">
            {SCOPES.map((s) => (
              <button
                key={s.id}
                onClick={() => setLeaderboardScope(s.id)}
                className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wide transition ${
                  leaderboardScope === s.id ? "bg-indigo-500 text-white shadow-sm" : `${theme.card} ${theme.textSoft} hover:text-indigo-500`
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-3.5 py-2 rounded-full text-xs font-semibold transition ${
                  period === p.id ? "bg-indigo-500/10 text-indigo-500" : `${theme.textSoft} hover:text-indigo-500`
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile — primary scopes + overflow menu */}
        <div className="flex sm:hidden items-center gap-2">
          <div className="flex-1 flex gap-2 overflow-x-auto">
            {SCOPES.slice(0, 2).map((s) => (
              <button
                key={s.id}
                onClick={() => setLeaderboardScope(s.id)}
                className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wide transition ${
                  leaderboardScope === s.id ? "bg-indigo-500 text-white shadow-sm" : `${theme.card} ${theme.textSoft}`
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setFiltersOpen(true)}
            aria-label="More filters"
            className={`h-9 w-9 shrink-0 flex items-center justify-center rounded-full ${theme.card} ${theme.textSoft}`}
          >
            <MoreVertical size={16} />
          </button>
        </div>
      </div>

      {/* ── LEADERBOARD CARD ── */}
      <div className={`${theme.card} rounded-3xl overflow-hidden`}>
        {isLoading ? (
          <>
            <div className="grid grid-cols-3 gap-3 sm:gap-4 items-end p-4 sm:p-6 pb-0">
              {[0, 1, 2].map((i) => (
                <div key={i} className={`rounded-3xl p-4 animate-pulse ${theme.soft} ${i === 1 ? "" : "mt-8"}`}>
                  <div className="w-16 h-16 rounded-full bg-black/10 mx-auto mb-3" />
                  <div className="h-3 w-3/4 mx-auto rounded bg-black/10 mb-2" />
                  <div className="h-3 w-1/2 mx-auto rounded bg-black/10" />
                </div>
              ))}
            </div>
            <div className={`divide-y ${theme.ledgerLine} mt-2`}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                  <div className={`h-4 w-6 rounded ${theme.soft}`} />
                  <div className={`h-11 w-11 rounded-full ${theme.soft}`} />
                  <div className="flex-1 space-y-2">
                    <div className={`h-3 w-1/3 rounded ${theme.soft}`} />
                    <div className={`h-2.5 w-1/4 rounded ${theme.soft}`} />
                  </div>
                  <div className={`h-4 w-10 rounded ${theme.soft}`} />
                </div>
              ))}
            </div>
          </>
        ) : error ? (
          <div className="p-10 text-center">
            <p className="font-semibold mb-1">Couldn't load the leaderboard</p>
            <p className={`text-sm mb-4 ${theme.textSoft}`}>Something went wrong. Please try again.</p>
            <button onClick={retry} className="px-4 py-2 rounded-full bg-indigo-500 text-white text-sm font-semibold">
              Retry
            </button>
          </div>
        ) : filteredLeaderboard.length === 0 ? (
          <div className="p-10 text-center">
            <Trophy size={32} className={`mx-auto mb-3 ${theme.textSoft}`} />
            <p className="font-semibold mb-1">{isSearching ? "No students match your search" : "No rankings yet"}</p>
            <p className={`text-sm ${theme.textSoft}`}>
              {isSearching ? "Try a different name or university." : "Be the first to earn XP in this view."}
            </p>
          </div>
        ) : (
          <>
            {podium.length > 0 && (
              <div className="p-4 sm:p-6 pb-2">
                <Podium
                  students={podium}
                  theme={theme}
                  getRankColor={getRankColor}
                  currentUserId={currentUserId}
                  onSelect={setSelectedStudent}
                />
              </div>
            )}

            <div className={`divide-y ${theme.ledgerLine}`}>
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

      {/* ── STICKY "YOUR RANK" (only when you're off-podium) ── */}
      {showStickyRank && (
        <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:left-6 sm:max-w-md sm:mx-auto z-40">
          <button
            onClick={() => setSelectedStudent(currentUserRow)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl backdrop-blur ring-2 ring-indigo-500/50 ${theme.card}`}
          >
            <span className="text-sm font-black text-indigo-500">#{currentUserRow.position}</span>
            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden text-xs font-bold text-slate-700 shrink-0">
              {currentUserRow.avatar ? (
                <img src={currentUserRow.avatar} className="w-full h-full object-cover" alt="You" />
              ) : (
                "Y"
              )}
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-semibold">You</p>
              <p className={`text-xs ${theme.textSoft}`}>{currentUserRow.xp || 0} XP</p>
            </div>
            {typeof currentUserRow.change === "number" && currentUserRow.change !== 0 && (
              <span
                className={`flex items-center gap-0.5 text-xs font-bold ${
                  currentUserRow.change > 0 ? "text-emerald-500" : "text-red-500"
                }`}
              >
                {currentUserRow.change > 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                {Math.abs(currentUserRow.change)}
              </span>
            )}
          </button>
        </div>
      )}

      {/* ── MOBILE FILTERS BOTTOM SHEET ── */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setFiltersOpen(false)} />
          <div className={`relative z-10 w-full rounded-t-3xl p-5 ${theme.card}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-base">Filters</h3>
              <button onClick={() => setFiltersOpen(false)} aria-label="Close filters">
                <X size={16} />
              </button>
            </div>

            <p className={`text-[11px] uppercase tracking-wide font-semibold mb-2 ${theme.textSoft}`}>Scope</p>
            <div className="flex flex-wrap gap-2 mb-5">
              {SCOPES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setLeaderboardScope(s.id)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wide transition ${
                    leaderboardScope === s.id ? "bg-indigo-500 text-white" : `${theme.soft} ${theme.textSoft}`
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <p className={`text-[11px] uppercase tracking-wide font-semibold mb-2 ${theme.textSoft}`}>Time period</p>
            <div className="flex flex-wrap gap-2 mb-5">
              {PERIODS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPeriod(p.id)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
                    period === p.id ? "bg-indigo-500 text-white" : `${theme.soft} ${theme.textSoft}`
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setFiltersOpen(false)}
              className="w-full py-3 rounded-2xl bg-indigo-500 text-white font-bold text-sm"
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {/* ── MINI PROFILE MODAL ── */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedStudent(null)} />
          <div className={`relative z-10 w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-6 ${theme.card}`}>
            <button
              onClick={() => setSelectedStudent(null)}
              aria-label="Close profile"
              className={`absolute top-4 right-4 p-2 rounded-full ${theme.soft}`}
            >
              <X size={16} />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden text-2xl font-bold text-slate-700 mb-3">
                {selectedStudent.avatar ? (
                  <img src={selectedStudent.avatar} className="w-full h-full object-cover" alt={selectedStudent.name || "Avatar"} />
                ) : (
                  (selectedStudent.name || "S")[0]
                )}
              </div>

              <h3 className="text-lg font-black">
                {selectedStudent.name || "Student"}
                {selectedStudent.id === currentUserId && <span className="text-indigo-500"> (you)</span>}
              </h3>

              {(selectedStudent.university || selectedStudent.department) && (
                <p className={`text-sm ${theme.textSoft}`}>{selectedStudent.university || selectedStudent.department}</p>
              )}

              <div className="flex items-center gap-2 mt-3 flex-wrap justify-center">
                <span
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-[#12182B]"
                  style={{ background: getRankColor(selectedStudent.rank) }}
                >
                  <Medal size={12} /> {selectedStudent.rank || "Bronze"}
                </span>
                {selectedStudent.level && (
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${theme.soft}`}>Level {selectedStudent.level}</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 w-full mt-5">
                <div className={`rounded-2xl p-3 ${theme.soft}`}>
                  <p className={`text-[11px] uppercase tracking-wide ${theme.textSoft}`}>Rank</p>
                  <p className="text-lg font-black">#{selectedStudent.position}</p>
                </div>
                <div className={`rounded-2xl p-3 ${theme.soft}`}>
                  <p className={`text-[11px] uppercase tracking-wide ${theme.textSoft}`}>XP</p>
                  <p className="text-lg font-black">{selectedStudent.xp || 0}</p>
                </div>
              </div>

              {Array.isArray(selectedStudent.achievements) && selectedStudent.achievements.length > 0 && (
                <div className="w-full mt-5 text-left">
                  <p className={`text-[11px] uppercase tracking-wide mb-2 ${theme.textSoft}`}>Achievements</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedStudent.achievements.map((b, i) => {
                      const { Icon, label } = getAchievementMeta(b);
                      return (
                        <span
                          key={`${label}-${i}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-500/10 text-indigo-500"
                        >
                          <Icon size={13} /> {label}
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
  if (!row) return <div />;
  const isFirst = place === 1;

  return (
    <button
      onClick={() => onSelect(row)}
      className={`flex flex-col items-center text-center rounded-3xl p-4 sm:p-5 transition hover:-translate-y-0.5 ${theme.soft} ${
        place === 2 ? "mt-6 sm:mt-8" : place === 3 ? "mt-10 sm:mt-12" : ""
      } ${isMe ? "ring-2 ring-indigo-500/60" : ""}`}
    >
      <div className="relative mb-3">
        <div
          className={`rounded-full overflow-hidden bg-slate-100 flex items-center justify-center font-bold text-slate-700 ${
            isFirst ? "w-20 h-20 sm:w-24 sm:h-24 text-2xl" : "w-14 h-14 sm:w-16 sm:h-16 text-lg"
          }`}
        >
          {row.avatar ? <img src={row.avatar} alt={row.name || "Avatar"} className="w-full h-full object-cover" /> : (row.name || "S")[0]}
        </div>
        <span className="absolute -bottom-1 -right-1 text-xl sm:text-2xl leading-none">{RANK_EMOJIS[place - 1]}</span>
        {isFirst && <Crown size={18} className="absolute -top-4 left-1/2 -translate-x-1/2 text-amber-400" fill="currentColor" />}
      </div>

      <p className={`font-bold truncate max-w-full ${isFirst ? "text-base sm:text-lg" : "text-sm"}`}>
        {row.name || "Student"}
        {isMe && <span className="text-indigo-500"> (you)</span>}
      </p>

      {row.university && <p className={`text-[11px] truncate max-w-full ${theme.textSoft}`}>{row.university}</p>}

      <p className={`font-black tabular-nums mt-1 ${isFirst ? "text-lg sm:text-xl text-indigo-500" : "text-sm"}`}>{row.xp || 0} XP</p>

      {row.level && <p className={`text-[10px] mt-0.5 ${theme.textSoft}`}>Level {row.level}</p>}

      {row.rank && (
        <span
          className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-[#12182B]"
          style={{ background: getRankColor(row.rank) }}
        >
          <Medal size={10} /> {row.rank}
        </span>
      )}

      {Array.isArray(row.achievements) && row.achievements.length > 0 && (
        <div className="flex items-center gap-1 mt-2">
          {row.achievements.slice(0, 2).map((b, i) => {
            const { Icon, label } = getAchievementMeta(b);
            return (
              <span
                key={`${label}-${i}`}
                title={label}
                className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center"
              >
                <Icon size={11} />
              </span>
            );
          })}
          {row.achievements.length > 2 && <span className="text-[10px] text-indigo-500 font-semibold">+{row.achievements.length - 2}</span>}
        </div>
      )}
    </button>
  );
}

function Podium({ students, theme, getRankColor, currentUserId, onSelect }) {
  const [first, second, third] = students;
  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4 items-end">
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

  return (
    <button
      onClick={() => onSelect(row)}
      className={`w-full grid grid-cols-[2rem_auto_1fr_auto] sm:grid-cols-[2.5rem_auto_1fr_auto_auto] items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 text-left transition ${
        isMe ? "bg-indigo-500/10" : "hover:bg-indigo-500/5"
      }`}
    >
      <span className={`text-sm font-semibold tabular-nums ${theme.textSoft}`}>{row.position}</span>

      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden text-sm font-bold text-slate-700 shrink-0">
        {row.avatar ? <img src={row.avatar} alt={row.name || "Avatar"} className="w-full h-full object-cover" /> : (row.name || "S")[0]}
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold truncate">
            {row.name || "Student"}
            {isMe && <span className="text-indigo-500"> (you)</span>}
          </p>
          {Array.isArray(row.achievements) &&
            row.achievements.slice(0, 2).map((b, i) => {
              const { Icon, label } = getAchievementMeta(b);
              return <Icon key={`${label}-${i}`} size={12} className="text-indigo-500 shrink-0" aria-label={label} />;
            })}
          {Array.isArray(row.achievements) && row.achievements.length > 2 && (
            <span className="text-[10px] text-indigo-500 font-semibold shrink-0">+{row.achievements.length - 2}</span>
          )}
        </div>
        <p className={`text-xs truncate ${theme.textSoft}`}>
          {row.university || row.department || "—"}
          {row.level ? ` · Lvl ${row.level}` : ""}
        </p>
      </div>

      <span
        className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-[#12182B] shrink-0 justify-self-end"
        style={{ background: getRankColor(row.rank) }}
      >
        <Medal size={11} /> {row.rank || "Bronze"}
      </span>

      <div className="flex items-center gap-2 justify-self-end">
        {hasChange && (
          <span className={`flex items-center gap-0.5 text-[11px] font-bold ${row.change > 0 ? "text-emerald-500" : "text-red-500"}`}>
            {row.change > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(row.change)}
          </span>
        )}
        <span className="text-sm font-bold tabular-nums text-right">{row.xp || 0}</span>
      </div>
    </button>
  );
}