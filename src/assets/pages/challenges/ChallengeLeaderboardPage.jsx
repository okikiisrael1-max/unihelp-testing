import React, { useEffect } from "react";
import { Medal } from "lucide-react";

const SCOPES = [
  { id: "global", label: "Global" },
  { id: "university", label: "My University" },
  { id: "department", label: "My Department" },
];

export default function ChallengeLeaderboardPage({ theme, leaderboard, leaderboardScope, setLeaderboardScope, fetchLeaderboard, getRankColor, currentUserId }) {
  useEffect(() => {
    fetchLeaderboard(leaderboardScope);
  }, [leaderboardScope]);

  return (
    <div>
      <div className="flex gap-2 mb-5">
        {SCOPES.map((s) => (
          <button
            key={s.id}
            onClick={() => setLeaderboardScope(s.id)}
            className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wide transition ${
              leaderboardScope === s.id ? "bg-[#6C5CE7] text-white" : `${theme.card} ${theme.textSoft} hover:opacity-80`
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className={`${theme.card} rounded-3xl overflow-hidden`}>
        {leaderboard.length === 0 && (
          <div className="p-8 text-center">
            <p className={`text-sm ${theme.textSoft}`}>No entries in this scope yet.</p>
          </div>
        )}
        <div className={`divide-y ${theme.ledgerLine}`}>
          {leaderboard.map((row) => {
            const isMe = row.id === currentUserId;
            const isTop3 = row.position <= 3;
            return (
              <div
                key={row.id}
                className={`flex items-center gap-4 px-5 py-4 transition-colors ${isMe ? "bg-[#6C5CE7]/[0.06]" : ""}`}
              >
                <span
                  className="w-8 text-center text-sm font-bold tabular-nums"
                  style={{ color: isTop3 ? getRankColor(row.rank) : undefined }}
                >
                  {row.position}
                </span>
                <div className="w-9 h-9 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-xs font-bold overflow-hidden shrink-0">
                  {row.avatar ? <img src={row.avatar} alt="" className="w-full h-full object-cover" /> : (row.name || "S")[0]}
                </div>
                <div className="min-w-0 flex-1">
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
                <span className="text-sm font-bold tabular-nums w-16 text-right shrink-0">
                  {row.xp || 0}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}