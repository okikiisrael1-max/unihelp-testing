import React from "react";
import { formatClock } from "../../data/theme";

const STATUS_TONE = {
  Passed: "text-emerald-500",
  Completed: "text-amber-500",
  Practice: "text-rose-500",
};

const formatDate = (ts) => {
  if (!ts?.toDate) return "";
  return ts.toDate().toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

export default function ChallengeHistoryPage({ theme, history, getStatusColor }) {
  return (
    <div className={`${theme.card} rounded-3xl overflow-hidden`}>
      {(!history || history.length === 0) && (
        <div className="p-10 text-center">
          <p className={`text-sm ${theme.textSoft}`}>No challenges completed yet — your history fills in as you go.</p>
        </div>
      )}
      <div className={`divide-y ${theme.ledgerLine}`}>
        {(history || []).map((item) => (
          <div key={item.id} className="flex items-center gap-4 px-5 py-4">
            <div className="w-12 text-center shrink-0">
              <p className={`text-[10px] uppercase ${theme.textFaint}`}>
                {formatDate(item.createdAt)}
              </p>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold capitalize truncate">{(item.category || "daily").replace("-", " ")}</p>
              <p className={`text-xs ${theme.textSoft}`}>
                {item.score}/{item.totalQuestions} correct · {item.durationSeconds ? formatClock(item.durationSeconds) : "—"}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className={`text-sm font-bold tabular-nums ${getStatusColor(item.accuracy || 0)}`}>
                {item.accuracy || 0}%
              </p>
              <p className={`text-[11px] font-semibold ${STATUS_TONE[item.status] || theme.textFaint}`}>{item.status || "—"}</p>
            </div>
            {item.xpEarned != null && (
              <span className="text-xs font-bold tabular-nums text-[#8B7FEF] shrink-0">
                +{item.xpEarned} xp
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}