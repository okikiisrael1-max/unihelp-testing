import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, Trophy, Calendar } from "lucide-react";

/*
====================================
 SCORE STORAGE STRUCTURE (LOCAL)
====================================
{
  "english": [
    { year: 2020, score: 18, total: 40 },
    { year: 2021, score: 25, total: 40 }
  ]
}
*/

// -----------------------------
// STORAGE HELPERS
// -----------------------------
const getScores = () => {
  const data = localStorage.getItem("jamb_scores");
  return data ? JSON.parse(data) : {};
};

const saveScores = (data) => {
  localStorage.setItem("jamb_scores", JSON.stringify(data));
};

const addScore = (subjectId, record) => {
  const all = getScores();

  if (!all[subjectId]) {
    all[subjectId] = [];
  }

  all[subjectId].push(record);
  saveScores(all);
};

// -----------------------------
// MAIN PAGE
// -----------------------------
export default function ScoreHistoryPage({ dark }) {
  const { subjectId } = useParams();
  const navigate = useNavigate();

  const [scores, setScores] = useState([]);

  useEffect(() => {
    const all = getScores();
    setScores(all[subjectId] || []);
  }, [subjectId]);

  const avgScore = useMemo(() => {
    if (!scores.length) return 0;
    const sum = scores.reduce((a, b) => a + b.score, 0);
    return Math.round(sum / scores.length);
  }, [scores]);

  const improvement = useMemo(() => {
    if (scores.length < 2) return 0;

    const first = scores[0].score;
    const last = scores[scores.length - 1].score;

    return last - first;
  }, [scores]);

  const card = dark
    ? "bg-white/5 border border-white/10"
    : "bg-white border border-slate-200 shadow-sm";

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-10">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center ${card}`}
        >
          <ArrowLeft />
        </button>

        <h1 className="text-2xl sm:text-3xl font-black uppercase">
          {subjectId} Performance
        </h1>

        <div className="w-12" />
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className={`${card} p-5 rounded-2xl`}>
          <div className="flex items-center gap-2">
            <Trophy className="text-yellow-500" />
            <h3 className="font-semibold">Average Score</h3>
          </div>
          <p className="text-3xl font-black mt-2">{avgScore}</p>
        </div>

        <div className={`${card} p-5 rounded-2xl`}>
          <div className="flex items-center gap-2">
            <TrendingUp className="text-green-500" />
            <h3 className="font-semibold">Improvement</h3>
          </div>
          <p className="text-3xl font-black mt-2">
            {improvement >= 0 ? "+" : ""}{improvement}
          </p>
        </div>

        <div className={`${card} p-5 rounded-2xl`}>
          <div className="flex items-center gap-2">
            <Calendar className="text-indigo-500" />
            <h3 className="font-semibold">Attempts</h3>
          </div>
          <p className="text-3xl font-black mt-2">{scores.length}</p>
        </div>
      </div>

      {/* HISTORY LIST */}
      <div className={`${card} rounded-3xl p-6`}>
        <h2 className="text-xl font-bold mb-4">Score History</h2>

        {scores.length === 0 ? (
          <p className="opacity-60">No records yet</p>
        ) : (
          <div className="space-y-3">
            {scores.map((s, i) => (
              <div
                key={i}
                className="flex justify-between items-center p-4 rounded-2xl bg-white/5"
              >
                <div>
                  <p className="font-semibold">Year {s.year}</p>
                  <p className="text-sm opacity-60">
                    {s.score} / {s.total}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-black text-indigo-500">
                    {Math.round((s.score / s.total) * 100)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* HOW TO SAVE SCORE (DEV NOTE UI) */}
      <div className="mt-8 text-sm opacity-70">
        Tip: call <code>addScore(subjectId, {"{"}year, score, total{"}"})</code> after CBT submit
      </div>
    </div>
  );
}

// -----------------------------
// EXPORT HELPER FOR CBT PAGE
// -----------------------------
export { addScore, getScores };
