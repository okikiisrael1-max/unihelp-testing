import React, {
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BrainCircuit,
  TrendingUp,
  Trophy,
  Clock3,
  Flame,
  BookOpen,
  Sparkles,
  Target,
  CalendarDays,
  Activity,
} from "lucide-react";

import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
} from "recharts";

import { db } from "../../../firebase/config";
import { AuthContext } from "../../context/AuthContext";

const toDate = (value) => {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  if (typeof value === "number") return new Date(value);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getPercentage = (item) => {
  if (Number.isFinite(item?.percentage)) return item.percentage;
  if (Number.isFinite(item?.accuracy)) return item.accuracy;
  const total = item?.totalQuestions ?? item?.total ?? 0;
  if (!total) return 0;
  return Math.round(((item?.score ?? 0) / total) * 100);
};

const getSubjectLabel = (item) => {
  if (item?.subject) return String(item.subject);
  if (Array.isArray(item?.subjects) && item.subjects.length) {
    return item.subjects.length === 1 ? item.subjects[0] : "Full Mock";
  }
  return "Practice";
};

const getCreatedAt = (item) => toDate(item?.createdAt || item?.completedAt);

const dayKey = (date) => date.toISOString().slice(0, 10);

const calculateStreak = (items) => {
  const days = new Set(
    items.map(getCreatedAt).filter(Boolean).map(dayKey)
  );

  if (!days.size) return 0;

  let cursor = new Date();
  let streak = 0;

  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
};

export default function AnalyticsPage({
  dark = false,
}) {
  const { user } = useContext(AuthContext);

  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const analyticsRef = collection(
      db,
      "jambUsers",
      user.uid,
      "mockResults"
    );

    const q = query(analyticsRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setAnalytics(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const totalStudyHours = useMemo(() => {
    const seconds = analytics.reduce(
      (acc, item) => acc + (item.durationSeconds || 0),
      0
    );

    return Math.round((seconds / 3600) * 10) / 10;
  }, [analytics]);

  const averageScore = useMemo(() => {
    if (analytics.length === 0) return 0;

    const total = analytics.reduce(
      (acc, item) => acc + getPercentage(item),
      0
    );

    return Math.round(total / analytics.length);
  }, [analytics]);

  const highestScore = useMemo(() => {
    if (analytics.length === 0) return 0;

    return Math.max(
      ...analytics.map((item) => getPercentage(item))
    );
  }, [analytics]);

  const dailyStreak = useMemo(() => calculateStreak(analytics), [analytics]);

  const weeklyProgress = useMemo(() => {
    const today = new Date();
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      return {
        key: dayKey(date),
        week: date.toLocaleDateString(undefined, { weekday: "short" }),
        total: 0,
        count: 0,
      };
    });

    const byDay = new Map(days.map((day) => [day.key, day]));

    analytics.forEach((item) => {
      const date = getCreatedAt(item);
      if (!date) return;
      const current = byDay.get(dayKey(date));
      if (!current) return;
      current.total += getPercentage(item);
      current.count += 1;
    });

    return days.map((day) => ({
      week: day.week,
      score: day.count ? Math.round(day.total / day.count) : 0,
    }));
  }, [analytics]);

  const subjectPerformance = useMemo(() => {
    const grouped = new Map();

    analytics.forEach((item) => {
      const subject = getSubjectLabel(item);
      const current = grouped.get(subject) || { subject, total: 0, count: 0 };
      current.total += getPercentage(item);
      current.count += 1;
      grouped.set(subject, current);
    });

    return Array.from(grouped.values())
      .map((item) => ({
        subject: item.subject,
        score: Math.round(item.total / item.count),
      }))
      .sort((a, b) => b.score - a.score);
  }, [analytics]);

  const recommendation = useMemo(() => {
    if (!subjectPerformance.length) {
      return "Complete a practice test or mock exam to get a personalized recommendation.";
    }

    const weakest = [...subjectPerformance].sort((a, b) => a.score - b.score)[0];
    return `Focus next on ${weakest.subject}; it is currently your lowest average at ${weakest.score}%.`;
  }, [subjectPerformance]);

  return (
    <div
      className={`min-h-screen px-4 py-8 md:px-8
      ${
        dark
          ? "bg-[#070B14] text-white"
          : "bg-gray-100 text-black"
      }`}
    >
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-5">
              <Sparkles
                size={16}
                className="text-purple-400"
              />

              <span className="text-sm text-gray-300">
                Smart Performance Analytics
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-black leading-tight">
              Your
              <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent ml-3">
                Analytics
              </span>
            </h1>

            <p className="text-gray-400 mt-4 max-w-2xl text-lg leading-relaxed">
              Monitor your JAMB preparation progress, performance,
              consistency, and study habits.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-3xl px-5 py-4 backdrop-blur-xl">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <BrainCircuit size={28} />
            </div>

            <div>
              <p className="text-gray-400 text-sm">
                AI Insights
              </p>

              <h2 className="text-xl font-bold mt-1">
                Improving Daily
              </h2>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">
          <div className="bg-white/5 border border-white/10 rounded-[28px] p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">
                  Average Score
                </p>

                <h2 className="text-4xl font-black mt-2">
                  {averageScore}
                </h2>
              </div>

              <div className="w-14 h-14 rounded-2xl bg-green-500/20 flex items-center justify-center text-green-400">
                <TrendingUp size={26} />
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-[28px] p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">
                  Highest Score
                </p>

                <h2 className="text-4xl font-black mt-2">
                  {highestScore}
                </h2>
              </div>

              <div className="w-14 h-14 rounded-2xl bg-yellow-500/20 flex items-center justify-center text-yellow-400">
                <Trophy size={26} />
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-[28px] p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">
                  Study Hours
                </p>

                <h2 className="text-4xl font-black mt-2">
                  {totalStudyHours}
                </h2>
              </div>

              <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                <Clock3 size={26} />
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-[28px] p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">
                  Daily Streak
                </p>

                <h2 className="text-4xl font-black mt-2">
                  {dailyStreak}
                </h2>
              </div>

              <div className="w-14 h-14 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-400">
                <Flame size={26} />
              </div>
            </div>
          </div>
        </div>

        {/* CHARTS */}
        <div className="grid xl:grid-cols-2 gap-7 mb-10">
          {/* AREA CHART */}
          <div className="bg-white/5 border border-white/10 rounded-[30px] p-6 backdrop-blur-xl overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold">
                  Weekly Progress
                </h2>

                <p className="text-gray-400 mt-1">
                  Your performance trend this week.
                </p>
              </div>

              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                <Activity size={22} />
              </div>
            </div>

            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyProgress}>
                  <defs>
                    <linearGradient
                      id="colorScore"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#a855f7"
                        stopOpacity={0.8}
                      />

                      <stop
                        offset="95%"
                        stopColor="#a855f7"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1f2937"
                  />

                  <XAxis
                    dataKey="week"
                    stroke="#9ca3af"
                  />

                  <YAxis stroke="#9ca3af" />

                  <Tooltip />

                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#a855f7"
                    fillOpacity={1}
                    fill="url(#colorScore)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* BAR CHART */}
          <div className="bg-white/5 border border-white/10 rounded-[30px] p-6 backdrop-blur-xl overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold">
                  Subject Analysis
                </h2>

                <p className="text-gray-400 mt-1">
                  Breakdown of your strongest subjects.
                </p>
              </div>

              <div className="w-12 h-12 rounded-2xl bg-pink-500/20 flex items-center justify-center text-pink-400">
                <BookOpen size={22} />
              </div>
            </div>

            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectPerformance}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1f2937"
                  />

                  <XAxis
                    dataKey="subject"
                    stroke="#9ca3af"
                  />

                  <YAxis stroke="#9ca3af" />

                  <Tooltip />

                  <Bar
                    dataKey="score"
                    fill="#ec4899"
                    radius={[10, 10, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* INSIGHTS */}
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          <div className="bg-white/5 border border-white/10 rounded-[28px] p-6 backdrop-blur-xl">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400 mb-5">
              <Target size={24} />
            </div>

            <h3 className="text-2xl font-bold">
              Goal Progress
            </h3>

            <p className="text-gray-400 mt-3 leading-relaxed">
              {highestScore
                ? `Your best recorded result is ${highestScore}%. Keep pushing toward your target JAMB score.`
                : "No completed result has been recorded yet."}
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-[28px] p-6 backdrop-blur-xl">
            <div className="w-14 h-14 rounded-2xl bg-green-500/20 flex items-center justify-center text-green-400 mb-5">
              <CalendarDays size={24} />
            </div>

            <h3 className="text-2xl font-bold">
              Study Consistency
            </h3>

            <p className="text-gray-400 mt-3 leading-relaxed">
              {dailyStreak
                ? `You have practiced for ${dailyStreak} consecutive day${dailyStreak === 1 ? "" : "s"}.`
                : "Complete a session today to begin your study streak."}
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-[28px] p-6 backdrop-blur-xl">
            <div className="w-14 h-14 rounded-2xl bg-yellow-500/20 flex items-center justify-center text-yellow-400 mb-5">
              <BrainCircuit size={24} />
            </div>

            <h3 className="text-2xl font-bold">
              AI Recommendation
            </h3>

            <p className="text-gray-400 mt-3 leading-relaxed">
              {recommendation}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
