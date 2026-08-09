import React, { useEffect } from "react";
import { Medal } from "lucide-react";

const SCOPES = [
  { id: "global", label: "Global" },
  { id: "university", label: "My University" },
  { id: "department", label: "My Department" },
];

const RANK_EMOJIS = ["🥇", "🥈", "🥉"];

export default function ChallengeLeaderboardPage({ theme, leaderboard, leaderboardScope, setLeaderboardScope, fetchLeaderboard, getRankColor, currentUserId }) {
  useEffect(() => {
    fetchLeaderboard(leaderboardScope);
  }, [leaderboardScope, fetchLeaderboard]);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-5">
        {SCOPES.map((s) => (
          <button
            key={s.id}
            onClick={() => setLeaderboardScope(s.id)}
            className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wide transition ${
              leaderboardScope === s.id
                ? "bg-[#6C5CE7] text-white shadow-sm"
                : `${theme.card} ${theme.textSoft} hover:border-[#6C5CE7]/20 hover:text-[#6C5CE7]`
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className={`${theme.card} rounded-3xl overflow-hidden`}>
        <div className={`grid grid-cols-[auto_auto_1fr_auto_auto] gap-4 px-5 py-3 text-[11px] uppercase tracking-[0.24em] ${theme.soft} ${theme.textSoft}`}>
          <span>Pos</span>
          <span className="sr-only">Avatar</span>
          <span>Player</span>
          <span className="text-right">Rank</span>
          <span className="text-right">XP</span>
        </div>

        {leaderboard.length === 0 ? (
          <div className="p-8 text-center">
            <p className={`text-sm ${theme.textSoft}`}>No leaderboard entries found for this scope yet.</p>
          </div>
        ) : (
          <div className={`divide-y ${theme.ledgerLine}`}>
            {leaderboard.map((row) => {
              const isMe = row.id === currentUserId;
              const rowHighlight = isMe ? "bg-[#EEF2FF]" : "hover:bg-[#EEF2FF]/60";
              const positionBadge = row.position <= 3 ? RANK_EMOJIS[row.position - 1] : row.position;
              return (
                <div
                  key={row.id}
                  className={`grid grid-cols-[auto_auto_1fr_auto_auto] items-center gap-4 px-5 py-4 transition ${rowHighlight}`}>
                  <span className="text-sm font-semibold tabular-nums" style={{ color: row.position <= 3 ? getRankColor(row.rank) : undefined }}>
                    {positionBadge}
                  </span>
                  <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden text-sm font-bold text-slate-700 shrink-0">
                    {row.avatar ? <img src={row.avatar} alt={row.name || "Avatar"} className="w-full h-full object-cover" /> : (row.name || "Student")[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {row.name || "Student"} {isMe && <span className="text-[#6C5CE7]">(you)</span>}
                    </p>
                    <p className={`text-xs ${theme.textSoft} truncate`}>{row.university || row.department || "—"}</p>
                  </div>
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-[#12182B] shrink-0"
                    style={{ background: getRankColor(row.rank) }}
                  >
                    <Medal size={11} /> {row.rank || "Bronze"}
                  </span>
                  <span className="text-sm font-bold tabular-nums text-right shrink-0 text-[#0E1220]">
                    {row.xp || 0}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
