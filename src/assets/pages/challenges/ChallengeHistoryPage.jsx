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
        {(history || []).map((item, index) => (
          <div
            key={item.id}
            className={`grid grid-cols-[auto_1fr_auto] gap-4 px-5 py-4 items-center ${index % 2 === 0 ? theme.soft : ""}`}
          >
            <div className="w-14 text-left">
              <p className={`text-[10px] uppercase ${theme.textFaint}`}>{formatDate(item.createdAt)}</p>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold capitalize truncate">{(item.category || "daily").replace("-", " ")}</p>
              <p className={`text-xs ${theme.textSoft}`}>
                {item.score}/{item.totalQuestions} correct · {item.durationSeconds ? formatClock(item.durationSeconds) : "—"}
              </p>
            </div>
            <div className="text-right">
              <p className={`text-sm font-bold tabular-nums ${getStatusColor(item.accuracy || 0)}`}>
                {item.accuracy || 0}%
              </p>
              <p className={`text-[11px] font-semibold ${STATUS_TONE[item.status] || theme.textFaint}`}>{item.status || "—"}</p>
              {item.xpEarned != null && (
                <span className="mt-2 inline-flex rounded-full bg-[#D4A72C]/15 px-2 py-1 text-[11px] font-semibold text-[#6C5CE7]">
                  +{item.xpEarned} xp
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
