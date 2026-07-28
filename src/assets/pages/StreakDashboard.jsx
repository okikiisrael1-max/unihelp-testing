import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../../firebase/config";
import { AuthContext } from "../context/AuthContext";
import {
  Flame,
  Calendar,
  CheckCircle2,
  Sparkles,
  Trophy,
  Medal,
  Target,
  TrendingUp,
  CalendarDays,
  ArrowRight,
  Clock,
} from "lucide-react";

const getTodayKey = (date = new Date()) => date.toISOString().slice(0, 10);

const buildCalendarDays = (daysBack = 120, activeDates = []) => {
  const activeSet = new Set(activeDates);
  return Array.from({ length: daysBack }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (daysBack - index - 1));
    const key = getTodayKey(date);
    return { key, day: date.getDate(), month: date.getMonth(), active: activeSet.has(key), isToday: key === getTodayKey() };
  });
};

export default function StreakDashboard({ dark = false }) {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const theme = {
    bg: dark ? "bg-[#070b14] text-white" : "bg-[#f5f7fb] text-gray-900",
    card: dark ? "bg-white/5 border border-white/10" : "bg-white border border-gray-200 shadow-sm",
    soft: dark ? "bg-white/5" : "bg-gray-100",
    textSoft: dark ? "text-gray-400" : "text-gray-500",
  };

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const fetchData = async () => {
      try {
        const snap = await getDoc(doc(db, "challengeUsers", auth.currentUser?.uid));
        if (snap.exists()) setStats(snap.data());
      } catch {}
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const streakDates = stats?.streakDates || [];
  const currentStreak = stats?.currentStreak || 0;
  const longestStreak = stats?.longestStreak || 0;
  const calendarDays = useMemo(() => buildCalendarDays(90, streakDates), [streakDates]);
  const completedToday = streakDates.includes(getTodayKey());

  const currentMonthDays = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const activeSet = new Set(streakDates);
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const key = getTodayKey(date);
      days.push({ day: i, key, active: activeSet.has(key), isToday: key === getTodayKey() });
    }
    return days;
  }, [streakDates]);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className={`min-h-screen md:pt-20 ${theme.bg} transition-all duration-300`}>
      <div className="px-4 md:px-6 lg:px-8 py-5 md:py-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className={`relative overflow-hidden rounded-4xl p-6 md:p-8 mb-8 border ${
          dark ? 'bg-linear-to-br from-orange-950 via-[#0f172a] to-black border-white/10' : 'bg-linear-to-br from-orange-600 via-red-600 to-pink-700 border-orange-400/20 text-white'
        }`}>
          <div className="absolute top-0 right-0 opacity-20"><Flame size={180} /></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <Flame size={36} className="text-orange-300" />
              <div>
                <h1 className="text-3xl md:text-4xl font-black">Daily Streak</h1>
                <p className="text-white/70 text-sm">Keep learning every day to build your streak</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-4 border border-white/10">
                <p className="text-xs text-white/70">Current Streak</p>
                <p className="text-3xl font-black flex items-center gap-2">
                  <Flame size={24} className="text-orange-400" /> {currentStreak} days
                </p>
              </div>
              <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-4 border border-white/10">
                <p className="text-xs text-white/70">Longest Streak</p>
                <p className="text-3xl font-black flex items-center gap-2">
                  <Trophy size={24} className="text-yellow-400" /> {longestStreak} days
                </p>
              </div>
              <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-4 border border-white/10">
                <p className="text-xs text-white/70">Today</p>
                <p className="text-3xl font-black flex items-center gap-2">
                  {completedToday ? (
                    <><CheckCircle2 size={24} className="text-green-400" /> Completed</>
                  ) : (
                    <><Clock size={24} className="text-white/70" /> Pending</>
                  )}
                </p>
              </div>
              <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-4 border border-white/10">
                <p className="text-xs text-white/70">Total Active Days</p>
                <p className="text-3xl font-black">{streakDates.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Calendar */}
        <div className={`${theme.card} rounded-3xl p-6 mb-8`}>
          <h2 className="text-xl font-black mb-1">{monthNames[new Date().getMonth()]} {new Date().getFullYear()}</h2>
          <p className={`text-sm ${theme.textSoft} mb-6`}>Your learning activity this month</p>
          
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className={`text-center text-xs font-bold ${theme.textSoft} py-1`}>{day}</div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {currentMonthDays.map((day, index) => (
              day ? (
                <div
                  key={index}
                  className={`aspect-square rounded-xl flex items-center justify-center text-sm font-medium transition-all ${
                    day.isToday
                      ? 'ring-2 ring-indigo-500 bg-indigo-500/10 text-indigo-500'
                      : day.active
                      ? 'bg-green-500/20 text-green-500 font-bold'
                      : theme.soft
                  }`}
                >
                  {day.active ? <Flame size={14} /> : day.day}
                </div>
              ) : (
                <div key={index} />
              )
            ))}
          </div>
        </div>

        {/* Streak History */}
        <div className={`${theme.card} rounded-3xl p-6`}>
          <h2 className="text-xl font-black mb-1">Activity History</h2>
          <p className={`text-sm ${theme.textSoft} mb-6`}>Last 90 days of learning activity</p>
          
          <div className="flex flex-wrap gap-1.5">
            {calendarDays.map((day) => (
              <div
                key={day.key}
                className={`w-4 h-4 rounded-sm transition-all ${
                  day.isToday
                    ? 'ring-2 ring-indigo-500 bg-indigo-500'
                    : day.active
                    ? 'bg-green-500'
                    : dark
                    ? 'bg-white/5'
                    : 'bg-gray-200'
                }`}
                title={`${day.key}: ${day.active ? 'Active' : 'Inactive'}`}
              />
            ))}
          </div>
          
          <div className="flex items-center gap-4 mt-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-green-500" />
              <span className={theme.textSoft}>Active</span>
            </div>
            <div className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded-sm ${dark ? 'bg-white/5' : 'bg-gray-200'}`} />
              <span className={theme.textSoft}>Inactive</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-indigo-500 ring-2 ring-indigo-500" />
              <span className={theme.textSoft}>Today</span>
            </div>
          </div>
        </div>

        {/* Call to action */}
        <div className="mt-8 text-center">
          <Link
            to="/challenge"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold hover:scale-105 transition-all"
          >
            <Sparkles size={20} />
            Start a Challenge
            <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    </div>
  );
}