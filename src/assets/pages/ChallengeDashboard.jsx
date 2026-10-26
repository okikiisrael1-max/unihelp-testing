import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { db, auth } from "../../firebase/config";
import { AuthContext } from "../context/AuthContext";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  Clock,
  Crown,
  Flame,
  Loader2,
  Medal,
  RotateCcw,
  SkipForward,
  Sparkles,
  Target,
  Trophy,
  X,
} from "lucide-react";
import ChallengeOverviewPage from "./challenges/ChallengeOverviewPage";
import ChallengeCategoriesPage from "./challenges/ChallengeCategoriesPage";
import ChallengeLeaderboardPage from "./challenges/ChallengeLeaderboardPage";
import ChallengeAchievementsPage from "./challenges/ChallengeAchievementsPage";
import ChallengeHistoryPage from "./challenges/ChallengeHistoryPage";
import { getTheme, RANK_COLORS, CATEGORY_TONES, getTimeLimit, colors } from "../data/theme";
import CountdownRing from "../components/CountdownRing";

/* =====================================================================
   READ / WRITE REDUCTION NOTES
   Before: every visit cost ~71 Firestore reads (stats 1 + history 20 +
   leaderboard 50) and every finished quiz cost ~72 more, plus the whole
   question bank was downloaded on every mount.
   Now:
   1. Stats, history, leaderboard, profile and the question bank live in
      module-level caches (TTL below). Revisiting costs 0 reads while fresh.
   2. The leaderboard (50 reads) loads only when its tab is opened, and
      the university / department filters run on that one cached result
      instead of re-querying.
   3. Finishing a quiz re-reads nothing: stats, history and the leaderboard
      row are updated locally, instantly, from data already in memory.
   4. The three writes for a finished quiz go out as one atomic batch.
   5. The profile document is read once per session, not once per quiz.
   ===================================================================== */

const QUESTIONS_URL = "https://unihelp-backend-dg0o.onrender.com/api/challenge-questions";
const QUESTIONS_PER_QUIZ = 8;

const STATS_TTL = 5 * 60 * 1000;
const LB_TTL = 3 * 60 * 1000;
const BANK_TTL = 30 * 60 * 1000;
const SEEN_CAP = 400;

const CHALLENGE_CATEGORIES = [
  { id: "daily", title: "Daily Challenge", subtitle: "New questions every day", icon: "calendar", questionCount: 1000 },
  { id: "weekly", title: "Weekly Quiz", subtitle: "Test your weekly knowledge", icon: "trophy", questionCount: 500 },
  { id: "department", title: "Department", subtitle: "Your course materials", icon: "library", questionCount: 1500 },
  { id: "level", title: "Level", subtitle: "Your academic level", icon: "layers", questionCount: 1200 },
  { id: "faculty", title: "Faculty", subtitle: "Cross-department knowledge", icon: "users", questionCount: 800 },
  { id: "speed-quiz", title: "Speed Quiz", subtitle: "12s a question. No mercy.", icon: "timer", questionCount: 600 },
  { id: "aptitude", title: "Aptitude", subtitle: "Logic & reasoning", icon: "lightbulb", questionCount: 700 },
  { id: "general-knowledge", title: "General Knowledge", subtitle: "Current affairs & GK", icon: "globe", questionCount: 900 },
];

const ACHIEVEMENTS_LIST = [
  { id: "first-challenge", title: "First Challenge", icon: "flag", target: 1, metric: "attempts" },
  { id: "seven-day-streak", title: "7 Day Streak", icon: "flame", target: 7, metric: "currentStreak" },
  { id: "thirty-day-streak", title: "30 Day Streak", icon: "flame", target: 30, metric: "currentStreak" },
  { id: "hundred-questions", title: "100 Questions", icon: "check", target: 100, metric: "questionsAnswered" },
  { id: "five-hundred-questions", title: "500 Questions", icon: "layers", target: 500, metric: "questionsAnswered" },
  { id: "thousand-questions", title: "1,000 Questions", icon: "trophy", target: 1000, metric: "questionsAnswered" },
  { id: "daily-dedicated", title: "Daily Dedicated", icon: "flame", target: 30, metric: "dailyCorrect" },
  { id: "department-expert", title: "Department Expert", icon: "library", target: 50, metric: "departmentCorrect" },
  { id: "aptitude-ace", title: "Aptitude Ace", icon: "lightbulb", target: 30, metric: "aptitudeCorrect" },
  { id: "speed-demon", title: "Speed Demon", icon: "timer", target: 20, metric: "speed-quizCorrect" },
  { id: "weekly-warrior", title: "Weekly Warrior", icon: "trophy", target: 10, metric: "weeklyCorrect" },
  { id: "top-performer", title: "Top Performer", icon: "crown", target: 5000, metric: "xp" },
  { id: "early-bird", title: "Early Bird", icon: "sun", target: 3, metric: "earlySessions" },
  { id: "night-owl", title: "Night Owl", icon: "moon", target: 3, metric: "nightSessions" },
  { id: "perfect-score", title: "Perfect Score", icon: "star", target: 1, metric: "perfectScores" },
];

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C5CE7] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

// Local calendar day (en-CA formats as YYYY-MM-DD), so the streak rolls over at the student's midnight.
const getTodayKey = (date = new Date()) => date.toLocaleDateString("en-CA");

const RANK_STEPS = [
  { name: "Bronze", min: 0 },
  { name: "Silver", min: 1200 },
  { name: "Gold", min: 3500 },
  { name: "Platinum", min: 7000 },
  { name: "Diamond", min: 12000 },
  { name: "Legend", min: 20000 },
];

const getRankForXp = (xp = 0) => {
  let rank = RANK_STEPS[0].name;
  for (const step of RANK_STEPS) if (xp >= step.min) rank = step.name;
  return rank;
};

const getRankProgress = (xp = 0) => {
  let idx = 0;
  RANK_STEPS.forEach((s, i) => {
    if (xp >= s.min) idx = i;
  });
  const next = RANK_STEPS[idx + 1];
  if (!next) return { next: null, pct: 100, needed: 0 };
  const span = next.min - RANK_STEPS[idx].min;
  return {
    next: next.name,
    pct: Math.min(100, Math.round(((xp - RANK_STEPS[idx].min) / span) * 100)),
    needed: next.min - xp,
  };
};

const calculateScore = ({ answers = [], durationSeconds = 0, totalQuestions = 1 }) => {
  const correct = answers.filter((a) => a.isCorrect).length;
  const wrong = answers.filter((a) => a.selectedIndex !== null && !a.isCorrect).length;
  const skipped = answers.filter((a) => a.selectedIndex === null).length;
  const timedOut = answers.filter((a) => a.timedOut).length;
  const accuracy = totalQuestions ? Math.round((correct / totalQuestions) * 100) : 0;
  const difficultyBonus = answers.reduce((sum, item) => {
    if (!item.isCorrect) return sum;
    if (item.difficulty === "Hard") return sum + 8;
    if (item.difficulty === "Medium") return sum + 5;
    return sum + 3;
  }, 0);
  const timeBonus = answers.reduce((sum, item) => {
    if (!item.isCorrect || item.timeLimit == null) return sum;
    const leftoverFrac = Math.max(0, item.secondsLeft ?? 0) / item.timeLimit;
    return sum + Math.round(leftoverFrac * 4);
  }, 0);
  const xpEarned = correct * 12 + difficultyBonus + timeBonus;
  const pointsEarned = correct * 100 + difficultyBonus * 5 + timeBonus * 10;
  const isPerfect = correct === totalQuestions;
  return { correct, wrong, skipped, timedOut, accuracy, xpEarned, pointsEarned, isPerfect, durationSeconds };
};

const statusForAccuracy = (accuracy) => (accuracy >= 70 ? "Passed" : accuracy >= 40 ? "Completed" : "Practice");

const USERS_COLLECTION = "challengeUsers";
const ATTEMPTS_COLLECTION = "attempts";
const COLLECTION = "challenges";

const defaultStats = (profile = {}) => ({
  uid: auth.currentUser?.uid || profile.uid || "",
  name: profile.username || auth.currentUser?.displayName || "Student",
  university: profile.school || "",
  department: profile.department || "",
  avatar: profile.photo || auth.currentUser?.photoURL || "",
  xp: 0,
  totalPoints: 0,
  rank: "Bronze",
  currentStreak: 0,
  longestStreak: 0,
  weeklyStreak: 0,
  questionsAnswered: 0,
  correctAnswers: 0,
  wrongAnswers: 0,
  attempts: 0,
  averageScore: 0,
  accuracy: 0,
  completionRate: 0,
  streakDates: [],
  activity: [],
  categoryStats: {},
  earlySessions: 0,
  nightSessions: 0,
  updatedAt: null,
});

/* ---------- module-level caches (survive route changes) ---------- */
let statsCache = null; // { uid, data, ts }
let historyCache = null; // { uid, rows, ts }
let lbCache = null; // { rows, ts }
let profileCache = null; // { uid, data }
let bankCache = null; // { list, ts }
let bankPromise = null;

const bankIsFresh = () => bankCache && Date.now() - bankCache.ts < BANK_TTL;

function loadBank() {
  if (bankIsFresh()) return Promise.resolve(bankCache.list);
  if (!bankPromise) {
    bankPromise = fetch(QUESTIONS_URL)
      .then((res) => {
        if (!res.ok) throw new Error("Question bank request failed");
        return res.json();
      })
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        bankCache = { list, ts: Date.now() };
        return list;
      })
      .finally(() => {
        bankPromise = null;
      });
  }
  return bankPromise;
}

/* ---------- question picking ---------- */
const shuffle = (list) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const seenKey = (category) => `challenge:seen:${category}`;
const readSeen = (category) => {
  try {
    const parsed = JSON.parse(localStorage.getItem(seenKey(category)) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};
const writeSeen = (category, ids) => {
  try {
    localStorage.setItem(seenKey(category), JSON.stringify(ids.slice(-SEEN_CAP)));
  } catch {
    /* storage unavailable */
  }
};

const filterByProfile = (bank, category, profile = {}) => {
  const userLevel = profile?.level?.toLowerCase().replace("l", "") || "";
  const userDept = (profile?.department || profile?.departmentName || "").trim().toLowerCase();
  const userFaculty = (profile?.faculty || "").trim().toLowerCase();

  let pool = category && !["daily", "random"].includes(category) ? bank.filter((q) => q.category === category) : [...bank];
  if (!pool.length) pool = [...bank];

  if (category === "department" && userDept) {
    const narrowed = pool.filter((q) => {
      const qDept = (q.department || q.subject || "").toLowerCase();
      return !qDept || qDept.includes(userDept) || userDept.includes(qDept);
    });
    if (narrowed.length) pool = narrowed;
  }
  if (category === "level" && userLevel) {
    const narrowed = pool.filter((q) => {
      const qLevel = (q.level || "").toLowerCase().replace("l", "");
      return !qLevel || qLevel === userLevel;
    });
    if (narrowed.length) pool = narrowed;
  }
  if (category === "faculty" && userFaculty) {
    const narrowed = pool.filter((q) => {
      const qFac = (q.faculty || "").toLowerCase();
      return !qFac || qFac.includes(userFaculty) || userFaculty.includes(qFac);
    });
    if (narrowed.length) pool = narrowed;
  }
  if (category === "speed-quiz") {
    const narrowed = pool.filter((q) => q.difficulty !== "Hard");
    if (narrowed.length) pool = narrowed;
  }
  return pool.filter((q) => Array.isArray(q.answers) && q.answers.length >= 2);
};

// Prefer questions this student hasn't seen yet; reset once the pool runs low.
const pickQuestions = (bank, category, profile) => {
  const pool = filterByProfile(bank, category, profile);
  let seen = readSeen(category);
  let fresh = pool.filter((q) => q.id == null || !seen.includes(q.id));
  if (fresh.length < QUESTIONS_PER_QUIZ) {
    seen = [];
    fresh = pool;
  }
  const picked = shuffle(fresh).slice(0, QUESTIONS_PER_QUIZ);
  writeSeen(category, [...seen, ...picked.map((q) => q.id).filter((id) => id != null)]);
  return picked;
};

/* ---------- stats math (pure) ---------- */
function buildStatsFields(previous, payload, profile, user) {
  const { score, questionCount, categoryKey, todayKey } = payload;
  const uid = auth.currentUser.uid;
  const nextXp = (previous.xp || 0) + score.xpEarned;
  const yesterdayKey = getTodayKey(new Date(Date.now() - 86400000));
  const uniqueDates = [...new Set(previous.streakDates || [])];
  let nextCurrent = uniqueDates.includes(yesterdayKey) ? (previous.currentStreak || 0) + 1 : 1;
  if (uniqueDates.includes(todayKey)) nextCurrent = previous.currentStreak || 0;
  const nextDates = uniqueDates.includes(todayKey) ? uniqueDates : [...uniqueDates, todayKey].slice(-180);
  const existingCat = previous.categoryStats?.[categoryKey] || {};
  const totalAttempts = (previous.attempts || 0) + 1;
  const totalAnswered = (previous.questionsAnswered || 0) + questionCount;
  const totalCorrect = (previous.correctAnswers || 0) + score.correct;
  const hour = new Date().getHours();

  return {
    uid,
    name: user?.displayName || previous.name || profile.username || "Student",
    // Fall back to the profile so the university / department leaderboards actually work.
    university: previous.university || profile.school || "",
    department: previous.department || profile.department || "",
    avatar: user?.photoURL || previous.avatar || profile.photo || "",
    xp: nextXp,
    totalPoints: (previous.totalPoints || 0) + score.pointsEarned,
    rank: getRankForXp(nextXp),
    currentStreak: nextCurrent,
    longestStreak: Math.max(previous.longestStreak || 0, nextCurrent),
    streakDates: nextDates,
    questionsAnswered: totalAnswered,
    correctAnswers: totalCorrect,
    wrongAnswers: (previous.wrongAnswers || 0) + score.wrong,
    attempts: totalAttempts,
    averageScore: Math.round(((previous.averageScore || 0) * (previous.attempts || 0) + score.accuracy) / totalAttempts),
    accuracy: totalAnswered ? Math.round((totalCorrect / totalAnswered) * 100) : 0,
    categoryStats: {
      ...(previous.categoryStats || {}),
      [categoryKey]: {
        attempted: (existingCat.attempted || 0) + questionCount,
        correct: (existingCat.correct || 0) + score.correct,
      },
    },
    activity: [
      { type: "challenge_completed", category: categoryKey, accuracy: score.accuracy, dateKey: todayKey },
      ...(previous.activity || []),
    ].slice(0, 12),
    earlySessions: (previous.earlySessions || 0) + (hour < 8 ? 1 : 0),
    nightSessions: (previous.nightSessions || 0) + (hour >= 21 ? 1 : 0),
    ...(score.isPerfect ? { perfectScores: (previous.perfectScores || 0) + 1 } : {}),
  };
}

const initialsOf = (name) =>
  (name || "S").trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "S";

/* =====================================================================
   COMPONENT
   ===================================================================== */
export default function ChallengeDashboard({ dark = false, initialTab = "dashboard" }) {
  const { user } = useContext(AuthContext);

  const cachedStats = statsCache && statsCache.uid === auth.currentUser?.uid ? statsCache.data : null;
  const cachedHistory = historyCache && historyCache.uid === auth.currentUser?.uid ? historyCache.rows : [];

  const [activeTab, setActiveTab] = useState(initialTab);
  const [stats, setStats] = useState(cachedStats);
  const [history, setHistory] = useState(cachedHistory);
  const [lbAll, setLbAll] = useState(lbCache?.rows || []);
  const [lbLoading, setLbLoading] = useState(false);
  const [leaderboardScope, setLeaderboardScope] = useState("global");
  const [loading, setLoading] = useState(!cachedStats);
  const [starting, setStarting] = useState(false);
  const [notice, setNotice] = useState(null); // { message, action? }

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved | error
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [revealAnswer, setRevealAnswer] = useState(false);
  const [awaitingNext, setAwaitingNext] = useState(false);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [timeLimit, setTimeLimit] = useState(25);
  const [rankBefore, setRankBefore] = useState(null);
  const [reviewFilter, setReviewFilter] = useState("all");

  const tickRef = useRef(null);
  const advanceRef = useRef(null);
  const pendingAnswersRef = useRef([]);
  const statsRef = useRef(cachedStats);
  const statsLoadedRef = useRef(Boolean(cachedStats));
  const lastPayloadRef = useRef(null);

  const theme = getTheme(dark);

  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  useEffect(
    () => () => {
      clearTimeout(tickRef.current);
      clearTimeout(advanceRef.current);
    },
    []
  );

  useEffect(() => setActiveTab(initialTab), [initialTab]);

  /* ---------------- cache-aware setters ---------------- */

  const applyStats = useCallback((data) => {
    statsRef.current = data;
    setStats(data);
    if (data?.uid) statsCache = { uid: data.uid, data, ts: Date.now() };
  }, []);

  const updateHistory = useCallback((fn) => {
    setHistory((cur) => {
      const next = fn(cur).slice(0, 20);
      historyCache = { uid: auth.currentUser?.uid, rows: next, ts: historyCache?.ts ?? Date.now() };
      return next;
    });
  }, []);

  /* ---------------- data loading ---------------- */

  const fetchStats = useCallback(
    async (uid) => {
      const snap = await getDoc(doc(db, USERS_COLLECTION, uid));
      const data = snap.exists() ? { ...defaultStats(), ...snap.data(), uid } : defaultStats();
      statsLoadedRef.current = true;
      applyStats(data);
      return data;
    },
    [applyStats]
  );

  const fetchHistory = useCallback(async (uid) => {
    try {
      const snap = await getDocs(
        query(collection(db, USERS_COLLECTION, uid, ATTEMPTS_COLLECTION), orderBy("createdAt", "desc"), limit(20))
      );
      const rows = snap.docs.map((item) => ({ id: item.id, ...item.data() }));
      historyCache = { uid, rows, ts: Date.now() };
      setHistory(rows);
    } catch {
      /* history is non-critical */
    }
  }, []);

  const getProfile = useCallback(async (uid) => {
    if (profileCache?.uid === uid) return profileCache.data;
    try {
      const snap = await getDoc(doc(db, "users", uid));
      const data = snap.exists() ? snap.data() : {};
      profileCache = { uid, data };
      return data;
    } catch {
      return {};
    }
  }, []);

  const loadAll = useCallback(
    async (uid, { force = false } = {}) => {
      const fresh = (c) => c && c.uid === uid && Date.now() - c.ts < STATS_TTL;
      const tasks = [];
      if (force || !fresh(statsCache)) tasks.push(fetchStats(uid));
      else if (statsRef.current?.uid !== uid) applyStats(statsCache.data);
      if (force || !fresh(historyCache)) tasks.push(fetchHistory(uid));
      else setHistory(historyCache.rows);
      await Promise.all(tasks);
    },
    [applyStats, fetchHistory, fetchStats]
  );

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return undefined;
    }
    let live = true;
    const run = () =>
      loadAll(user.uid)
        .catch(() => {
          if (!live) return;
          if (!statsRef.current) setStats(defaultStats());
          setNotice({
            message: "We couldn't load your progress. What you see may be out of date.",
            action: { label: "Retry", run: () => loadAll(user.uid, { force: true }).catch(() => {}) },
          });
        })
        .finally(() => live && setLoading(false));
    run();
    return () => {
      live = false;
    };
  }, [user, loadAll]);

  // Warm the question bank (and wake the server) without blocking anything.
  useEffect(() => {
    loadBank().catch(() => {});
  }, []);

  const loadLeaderboard = useCallback(async ({ force = false } = {}) => {
    if (!force && lbCache && Date.now() - lbCache.ts < LB_TTL) {
      setLbAll(lbCache.rows);
      return;
    }
    setLbLoading(true);
    try {
      const snap = await getDocs(query(collection(db, USERS_COLLECTION), orderBy("xp", "desc"), limit(50)));
      const rows = snap.docs.map((item) => ({ id: item.id, ...item.data() }));
      lbCache = { rows, ts: Date.now() };
      setLbAll(rows);
    } catch {
      setNotice({
        message: "The leaderboard couldn't load.",
        action: { label: "Retry", run: () => loadLeaderboard({ force: true }) },
      });
    } finally {
      setLbLoading(false);
    }
  }, []);

  // The leaderboard is only read when someone actually opens it.
  useEffect(() => {
    if (activeTab === "leaderboard" && user) loadLeaderboard();
  }, [activeTab, user, loadLeaderboard]);

  // Scope filters are applied to the one cached result: 0 extra reads.
  const leaderboard = useMemo(() => {
    const rows = lbAll.filter((item) => {
      if (leaderboardScope === "university") return item.university && item.university === stats?.university;
      if (leaderboardScope === "department") return item.department && item.department === stats?.department;
      return true;
    });
    return rows.map((item, i) => ({ ...item, position: i + 1 }));
  }, [lbAll, leaderboardScope, stats?.university, stats?.department]);

  // Kept for the leaderboard page: serves from cache unless stale.
  const fetchLeaderboard = useCallback(() => loadLeaderboard(), [loadLeaderboard]);

  const achievements = useMemo(() => {
    if (!stats) return [];
    return ACHIEVEMENTS_LIST.map((item) => {
      const catMatch = item.metric?.match(/^(.+?)Correct$/);
      const value = catMatch ? stats.categoryStats?.[catMatch[1]]?.correct || 0 : stats[item.metric] || 0;
      const progress = Math.min(1, value / item.target);
      return { ...item, value, progress, unlocked: progress >= 1 };
    });
  }, [stats]);

  /* ---------------- quiz flow ---------------- */

  const handleStartQuiz = async (category) => {
    if (starting) return;
    setNotice(null);
    const uid = auth.currentUser?.uid;
    const ready = bankIsFresh() && (!uid || profileCache?.uid === uid);
    if (!ready) setStarting(true); // only show the spinner when we truly have to wait
    try {
      const [bank, profile] = await Promise.all([loadBank(), uid ? getProfile(uid) : Promise.resolve({})]);
      const qs = pickQuestions(bank, category.id, profile);
      if (!qs.length) {
        setNotice({ message: "No questions are available for this challenge right now. Please try another one." });
        return;
      }
      clearTimeout(advanceRef.current);
      const limitSecs = getTimeLimit(category.id);
      setRankBefore(statsRef.current?.rank || "Bronze");
      setSelectedCategory(category);
      setQuestions(qs);
      setCurrentQuestionIndex(0);
      setAnswers([]);
      setSelectedIndex(null);
      setRevealAnswer(false);
      setAwaitingNext(false);
      setConfirmQuit(false);
      setTimeLimit(limitSecs);
      setSecondsLeft(limitSecs);
      setQuizStarted(true);
      setQuizFinished(false);
      setQuizResult(null);
      setSaveState("idle");
      setReviewFilter("all");
      lastPayloadRef.current = null;
      setStartTime(Date.now());
    } catch (err) {
      console.error(err);
      setNotice({
        message: "We couldn't load the questions. The server may be waking up, so try again in a few seconds.",
        action: { label: "Try again", run: () => handleStartQuiz(category) },
      });
    } finally {
      setStarting(false);
    }
  };

  // Per-question countdown.
  useEffect(() => {
    if (!quizStarted || quizFinished || revealAnswer) return;
    if (secondsLeft <= 0) {
      commitAnswer(null, true);
      return;
    }
    tickRef.current = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(tickRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, quizStarted, quizFinished, revealAnswer]);

  // Don't lose a quiz to an accidental refresh or tab close.
  useEffect(() => {
    if (!quizStarted) return undefined;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [quizStarted]);

  const advance = (newAnswers) => {
    setAwaitingNext(false);
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedIndex(null);
      setRevealAnswer(false);
      setSecondsLeft(timeLimit);
    } else {
      finishQuiz(newAnswers);
    }
  };

  const commitAnswer = (index, timedOut = false) => {
    const current = questions[currentQuestionIndex];
    if (!current) return;
    const isCorrect = index !== null && index === current.correctIndex;
    setSelectedIndex(index);
    setRevealAnswer(true);
    const newAnswers = [
      ...answers,
      {
        questionId: current.id ?? null,
        selectedIndex: index,
        isCorrect,
        difficulty: current.difficulty ?? null,
        timeLimit,
        secondsLeft: timedOut ? 0 : secondsLeft,
        timedOut,
      },
    ];
    setAnswers(newAnswers);
    pendingAnswersRef.current = newAnswers;

    const waitForUser = !!current.explanation && selectedCategory?.id !== "speed-quiz" && !timedOut;
    if (waitForUser) {
      setAwaitingNext(true);
    } else {
      advanceRef.current = setTimeout(() => advance(newAnswers), timedOut ? 700 : 900);
    }
  };

  const handleAnswer = (index) => {
    if (revealAnswer) return;
    commitAnswer(index, false);
  };

  const handleSkip = () => {
    if (revealAnswer) return;
    commitAnswer(null, false);
  };

  const goNext = () => {
    if (!awaitingNext) return;
    advance(pendingAnswersRef.current);
  };

  // Keyboard: A-D / 1-4 answer, S skip, Enter continue.
  useEffect(() => {
    if (!quizStarted) return;
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const current = questions[currentQuestionIndex];
      if (!current) return;
      if (revealAnswer) {
        if (awaitingNext && (e.key === "Enter" || e.key === "ArrowRight")) {
          e.preventDefault();
          goNext();
        }
        return;
      }
      const key = e.key.toLowerCase();
      let idx = -1;
      if (/^[1-9]$/.test(key)) idx = Number(key) - 1;
      else if (/^[a-z]$/.test(key) && key !== "s") idx = key.charCodeAt(0) - 97;
      if (idx >= 0 && idx < current.answers.length) {
        e.preventDefault();
        handleAnswer(idx);
      } else if (key === "s") {
        e.preventDefault();
        handleSkip();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizStarted, revealAnswer, awaitingNext, currentQuestionIndex, questions, answers, secondsLeft]);

  /* ---------------- saving ---------------- */

  const saveAttempt = async (payload) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    setSaveState("saving");
    try {
      // Normally this is already in memory. Only fetch if the first load failed,
      // so we never overwrite real XP with defaults.
      if (!payload.base) {
        payload.base = statsLoadedRef.current && statsRef.current ? statsRef.current : await fetchStats(uid);
      }
      const base = payload.base;
      const profile = await getProfile(uid);
      const fields = buildStatsFields(base, payload, profile, user);

      // Show the new XP, rank, streak and history row immediately.
      applyStats({ ...base, ...fields });
      const historyItem = {
        id: payload.attemptRef.id,
        category: payload.categoryKey,
        score: payload.score.correct,
        totalQuestions: payload.questionCount,
        accuracy: payload.score.accuracy,
        durationSeconds: payload.durationSeconds,
        xpEarned: payload.score.xpEarned,
        pointsEarned: payload.score.pointsEarned,
        status: statusForAccuracy(payload.score.accuracy),
        answers: payload.finalAnswers,
        createdAt: Timestamp.now(),
        dateKey: payload.todayKey,
      };
      updateHistory((cur) => [historyItem, ...cur.filter((h) => h.id !== historyItem.id)]);
      if (lbCache) {
        const row = { id: uid, ...base, ...fields };
        const rows = [...lbCache.rows.filter((r) => r.id !== uid), row]
          .sort((a, b) => (b.xp || 0) - (a.xp || 0))
          .slice(0, 50);
        lbCache = { ...lbCache, rows };
        setLbAll(rows);
      }

      // One atomic round trip instead of three separate writes.
      const batch = writeBatch(db);
      batch.set(doc(db, USERS_COLLECTION, uid), { ...fields, updatedAt: serverTimestamp() }, { merge: true });
      const { createdAt, id, ...attemptDoc } = historyItem;
      batch.set(payload.attemptRef, { ...attemptDoc, createdAt: serverTimestamp() });
      batch.set(doc(db, COLLECTION, "latestAttempts", "items", id), {
        category: payload.categoryKey,
        score: payload.score.correct,
        totalQuestions: payload.questionCount,
        accuracy: payload.score.accuracy,
        uid,
        name: fields.name,
        university: fields.university,
        department: fields.department,
      });
      await batch.commit();
      setSaveState("saved");
    } catch (err) {
      console.error("Failed to save result:", err);
      // Roll the optimistic update back so the numbers never lie.
      if (payload.base) applyStats(payload.base);
      updateHistory((cur) => cur.filter((h) => h.id !== payload.attemptRef.id));
      lbCache = null;
      setSaveState("error");
    }
  };

  const finishQuiz = (finalAnswers) => {
    const durationSeconds = Math.round((Date.now() - startTime) / 1000);
    const score = calculateScore({ answers: finalAnswers, durationSeconds, totalQuestions: questions.length });
    setQuizResult(score);
    setQuizFinished(true);
    setQuizStarted(false);

    const uid = auth.currentUser?.uid;
    if (!uid) return; // guests can play, but nothing is saved
    const payload = {
      score,
      finalAnswers,
      durationSeconds,
      questionCount: questions.length,
      categoryKey: selectedCategory?.id || "daily",
      todayKey: getTodayKey(),
      attemptRef: doc(collection(db, USERS_COLLECTION, uid, ATTEMPTS_COLLECTION)),
      base: null,
    };
    lastPayloadRef.current = payload;
    saveAttempt(payload);
  };

  const retrySave = () => {
    if (lastPayloadRef.current) saveAttempt(lastPayloadRef.current);
  };

  const handleBackToDashboard = () => {
    clearTimeout(tickRef.current);
    clearTimeout(advanceRef.current);
    setQuizStarted(false);
    setQuizFinished(false);
    setSelectedCategory(null);
    setQuestions([]);
    setAnswers([]);
    setQuizResult(null);
    setAwaitingNext(false);
    setConfirmQuit(false);
    setActiveTab("dashboard");
  };

  const getRankColor = (rank) => RANK_COLORS[rank] || colors.violet;

  const getStatusColor = (accuracy) => {
    if (accuracy >= 70) return "text-emerald-500";
    if (accuracy >= 40) return "text-amber-500";
    return "text-rose-500";
  };

  const tabItems = [
    { id: "dashboard", label: "Overview", icon: BarChart3 },
    { id: "categories", label: "Challenges", icon: Target },
    { id: "leaderboard", label: "Leaderboard", icon: Trophy },
    { id: "achievements", label: "Achievements", icon: Medal },
    { id: "history", label: "History", icon: Clock },
  ];

  /* ---------------- shared bits ---------------- */

  const noticeBar = notice ? (
    <div role="alert" className="mb-5 flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm">
      <AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-500" />
      <p className="flex-1">{notice.message}</p>
      {notice.action && (
        <button
          type="button"
          onClick={() => {
            const run = notice.action.run;
            setNotice(null);
            run();
          }}
          className={`shrink-0 rounded-md px-1 font-bold underline ${FOCUS_RING}`}
        >
          {notice.action.label}
        </button>
      )}
      <button
        type="button"
        onClick={() => setNotice(null)}
        aria-label="Dismiss message"
        className={`shrink-0 rounded-md p-1 opacity-60 hover:opacity-100 ${FOCUS_RING}`}
      >
        <X size={15} />
      </button>
    </div>
  ) : null;

  const startingOverlay = starting ? (
    <div role="status" aria-live="polite" className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 px-6 backdrop-blur-sm">
      <div className={`${theme.card} max-w-xs rounded-3xl px-7 py-6 text-center`}>
        <Loader2 size={26} className="mx-auto mb-3 animate-spin text-[#6C5CE7]" />
        <p className="text-sm font-bold">Getting your questions ready…</p>
        <p className={`mt-1 text-xs ${theme.textSoft}`}>The first load can take a few seconds.</p>
      </div>
    </div>
  ) : null;

  /* ---------------- initial loading ---------------- */

  if (loading && !stats) {
    return (
      <div className={`flex min-h-screen items-center justify-center md:pt-20 ${theme.page}`}>
        <div className="text-center" role="status" aria-live="polite">
          <div className="relative mx-auto mb-5 h-14 w-14">
            <div className="absolute inset-0 rounded-full border-2 border-[#6C5CE7]/20" />
            <div className="absolute inset-0 rounded-full border-2 border-b-transparent border-l-transparent border-r-transparent border-t-[#6C5CE7] motion-safe:animate-spin" />
          </div>
          <h2 className="text-sm font-semibold">Loading your challenges…</h2>
        </div>
      </div>
    );
  }

  /* ---------------- QUIZ SCREEN ---------------- */

  if (quizStarted) {
    const current = questions[currentQuestionIndex];
    if (!current) return null;
    const tone = CATEGORY_TONES[selectedCategory?.id]?.accent || "#6C5CE7";
    const isLast = currentQuestionIndex + 1 === questions.length;
    const answeredCorrect = revealAnswer && selectedIndex === current.correctIndex;
    const correctSoFar = answers.filter((a) => a.isCorrect).length;
    const idle = dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)";

    return (
      <div className={`min-h-screen md:pt-20 ${theme.page}`}>
        <div className="mx-auto max-w-3xl px-4 py-5 md:px-6 md:py-8 lg:px-8">
          <div className="mb-3 flex items-center justify-between gap-3">
            {confirmQuit ? (
              <div className={`flex items-center gap-1.5 rounded-full p-1 ${theme.card}`}>
                <button
                  type="button"
                  onClick={handleBackToDashboard}
                  className={`rounded-full bg-rose-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-rose-600 ${FOCUS_RING}`}
                >
                  Quit quiz
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmQuit(false)}
                  className={`rounded-full px-3 py-2 text-xs font-bold transition hover:opacity-70 ${FOCUS_RING}`}
                >
                  Keep playing
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmQuit(true)}
                className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold transition hover:opacity-80 ${theme.card} ${FOCUS_RING}`}
              >
                <X size={14} /> Quit
              </button>
            )}

            <div className="flex min-w-0 flex-1 flex-col items-center">
              <span className="text-xs font-bold" style={{ color: tone }}>
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span className={`max-w-full truncate text-[11px] ${theme.textSoft}`}>
                {selectedCategory?.title} · {correctSoFar} correct
              </span>
            </div>

            <CountdownRing secondsLeft={secondsLeft} totalSeconds={timeLimit} size={52} />
          </div>

          {/* One segment per question, coloured as you go */}
          <div
            className="mb-6 flex gap-1.5"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={questions.length}
            aria-valuenow={currentQuestionIndex + (revealAnswer ? 1 : 0)}
            aria-label="Quiz progress"
          >
            {questions.map((_, i) => {
              const a = answers[i];
              const bg = a
                ? a.isCorrect
                  ? "#219E8B"
                  : a.selectedIndex === null
                  ? "#D4A72C"
                  : "#E2574C"
                : i === currentQuestionIndex
                ? tone
                : idle;
              return <span key={i} className="h-1.5 flex-1 rounded-full transition-colors duration-300" style={{ background: bg }} />;
            })}
          </div>

          <div className={`${theme.card} mb-6 rounded-[28px] p-5 sm:p-6 md:p-8`}>
            <div className="mb-5 flex items-center gap-2">
              <span
                className="rounded-full px-3 py-1 text-xs font-bold"
                style={{
                  background:
                    current.difficulty === "Hard"
                      ? "rgba(226,87,76,0.12)"
                      : current.difficulty === "Medium"
                      ? "rgba(212,167,44,0.14)"
                      : "rgba(33,158,139,0.12)",
                  color: current.difficulty === "Hard" ? "#E2574C" : current.difficulty === "Medium" ? "#B8860B" : "#219E8B",
                }}
              >
                {current.difficulty || "Standard"}
              </span>
              {current.subject && <span className={`text-xs ${theme.textSoft}`}>{current.subject}</span>}
            </div>

            <h3 className="mb-7 text-xl font-semibold leading-snug md:text-[26px]">{current.prompt}</h3>

            <div className="space-y-3" role="group" aria-label="Answer options">
              {current.answers.map((answer, index) => {
                const isChosen = selectedIndex === index;
                const isRight = index === current.correctIndex;
                let stateClasses = `${theme.ledgerLine} ${dark ? "bg-white/[0.02]" : "bg-white"} hover:border-[#6C5CE7]`;
                if (revealAnswer) {
                  if (isRight) stateClasses = "border-[#219E8B] bg-[#219E8B]/10";
                  else if (isChosen) stateClasses = "border-[#E2574C] bg-[#E2574C]/10";
                  else stateClasses = `${theme.ledgerLine} opacity-50`;
                }
                return (
                  <button
                    key={index}
                    type="button"
                    disabled={revealAnswer}
                    onClick={() => handleAnswer(index)}
                    className={`min-h-[56px] w-full rounded-2xl border p-4 text-left transition-all duration-200 ${stateClasses} ${
                      !revealAnswer ? "motion-safe:active:scale-[0.99]" : ""
                    } ${FOCUS_RING}`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                        style={{ background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }}
                      >
                        {revealAnswer && isRight ? (
                          <Check size={15} className="text-[#219E8B]" />
                        ) : revealAnswer && isChosen ? (
                          <X size={15} className="text-[#E2574C]" />
                        ) : (
                          String.fromCharCode(65 + index)
                        )}
                      </span>
                      <span className="text-[15px] font-medium">{answer}</span>
                      {revealAnswer && isRight && <span className="sr-only">Correct answer</span>}
                      {revealAnswer && isChosen && !isRight && <span className="sr-only">Your answer, incorrect</span>}
                    </div>
                  </button>
                );
              })}
            </div>

            <div aria-live="polite">
              {revealAnswer && (
                <div className={`mt-5 rounded-2xl p-4 ${theme.soft}`}>
                  <p
                    className={`text-sm font-bold ${
                      answeredCorrect ? "text-emerald-500" : selectedIndex === null ? "text-amber-500" : "text-rose-500"
                    }`}
                  >
                    {answeredCorrect
                      ? "Correct"
                      : selectedIndex === null
                      ? answers[answers.length - 1]?.timedOut
                        ? "Time's up"
                        : "Skipped"
                      : "Not quite"}
                  </p>
                  {current.explanation && <p className={`mt-1 text-sm leading-6 ${theme.textSoft}`}>{current.explanation}</p>}
                </div>
              )}
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              {!revealAnswer ? (
                <>
                  <button
                    type="button"
                    onClick={handleSkip}
                    className={`flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-bold transition hover:opacity-70 ${theme.soft} ${theme.textSoft} ${FOCUS_RING}`}
                  >
                    <SkipForward size={13} /> Skip
                  </button>
                  <span className={`hidden text-xs md:inline ${theme.textFaint}`}>Press A–D to answer, S to skip</span>
                </>
              ) : awaitingNext ? (
                <>
                  <span className={`hidden text-xs md:inline ${theme.textFaint}`}>Press Enter to continue</span>
                  <button
                    type="button"
                    onClick={goNext}
                    autoFocus
                    className={`ml-auto inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white transition hover:brightness-110 ${FOCUS_RING}`}
                    style={{ background: tone }}
                  >
                    {isLast ? "See results" : "Next question"}
                    <ArrowRight size={15} />
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- RESULTS SCREEN ---------------- */

  if (quizFinished && quizResult) {
    const rankedUp = saveState !== "error" && stats?.rank && rankBefore && stats.rank !== rankBefore;
    const nextRank = getRankProgress(stats?.xp || 0);
    const headline = quizResult.isPerfect
      ? "A perfect run."
      : quizResult.accuracy >= 70
      ? "Well earned."
      : quizResult.accuracy >= 40
      ? "Solid effort."
      : "Back to the books, then try again.";
    const reviewItems = questions
      .map((q, i) => ({ q, ans: answers[i], i }))
      .filter(({ ans }) => reviewFilter === "all" || !ans?.isCorrect);

    return (
      <div className={`min-h-screen md:pt-20 ${theme.page}`}>
        {startingOverlay}
        <div className="mx-auto max-w-3xl px-4 py-5 md:px-6 md:py-8 lg:px-8">
          {noticeBar}

          <section className={`${theme.banner} mb-6 rounded-[28px] p-6 text-center sm:p-8 md:p-10`}>
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
              {quizResult.isPerfect ? <Crown size={30} className="text-[#D4A72C]" /> : <Trophy size={30} className="text-[#8B7FEF]" />}
            </div>
            <p className="mb-2 text-sm text-white/60">{selectedCategory?.title}</p>
            <h2 className="mb-2 text-3xl font-semibold text-white md:text-4xl">{headline}</h2>
            <p className="text-sm text-white/70">
              You got {quizResult.correct} of {questions.length} right.
            </p>
            {rankedUp && (
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-amber-300">
                <Medal size={13} /> You reached {stats.rank}
              </p>
            )}

            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                { label: "Accuracy", value: `${quizResult.accuracy}%`, tone: "#8B7FEF" },
                { label: "Correct", value: `${quizResult.correct}/${questions.length}`, tone: "#3FC1A8" },
                { label: "XP earned", value: `+${quizResult.xpEarned}`, tone: "#E8BC47" },
                { label: "Time", value: `${quizResult.durationSeconds}s`, tone: "#F08A80" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                  <p className="mb-1 text-xs text-white/50">{s.label}</p>
                  <p className="text-2xl font-bold tabular-nums" style={{ color: s.tone }}>
                    {s.value}
                  </p>
                </div>
              ))}
            </div>

            {stats && auth.currentUser && saveState !== "error" && (
              <p className="mt-4 text-xs text-white/60">
                {nextRank.next ? `${nextRank.needed.toLocaleString()} XP to ${nextRank.next}` : "You're at the top tier."}
              </p>
            )}

            {/* Save status: never blocks the buttons below */}
            <div className="mt-5 min-h-[1.5rem] text-sm" role="status" aria-live="polite">
              {!auth.currentUser && <span className="text-white/60">Sign in to save XP and join the leaderboard.</span>}
              {saveState === "saving" && (
                <span className="inline-flex items-center gap-2 text-white/70">
                  <Loader2 size={14} className="animate-spin" /> Saving your progress…
                </span>
              )}
              {saveState === "saved" && (
                <span className="inline-flex items-center gap-2 text-emerald-300">
                  <CheckCircle2 size={15} /> Progress saved
                </span>
              )}
              {saveState === "error" && (
                <span className="inline-flex flex-wrap items-center justify-center gap-2 text-amber-300">
                  <AlertCircle size={15} /> We couldn't save this attempt.
                  <button type="button" onClick={retrySave} className={`rounded px-1 font-bold underline ${FOCUS_RING}`}>
                    Retry
                  </button>
                </span>
              )}
            </div>

            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => selectedCategory && handleStartQuiz(selectedCategory)}
                className={`inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-bold text-[#12182B] transition hover:bg-white/90 ${FOCUS_RING}`}
              >
                <RotateCcw size={15} /> Play again
              </button>
              <button
                type="button"
                onClick={handleBackToDashboard}
                className={`rounded-full border border-white/25 px-7 py-3 text-sm font-bold text-white transition hover:bg-white/10 ${FOCUS_RING}`}
              >
                Back to dashboard
              </button>
            </div>
          </section>

          <section className={`${theme.card} rounded-[28px] p-5 sm:p-6`}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-base font-semibold">
                <Sparkles size={16} className="text-[#6C5CE7]" /> Review your answers
              </h3>
              <div className={`flex rounded-full p-1 ${theme.soft}`} role="group" aria-label="Filter review">
                {[
                  ["all", "All"],
                  ["missed", "Missed"],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={reviewFilter === id}
                    onClick={() => setReviewFilter(id)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${FOCUS_RING} ${
                      reviewFilter === id ? "bg-[#6C5CE7] text-white" : theme.textSoft
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {reviewItems.length === 0 ? (
              <p className={`rounded-2xl p-6 text-center text-sm ${theme.soft} ${theme.textSoft}`}>
                Nothing missed. Every answer was right.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {reviewItems.map(({ q, ans, i }) => {
                  const status = ans?.isCorrect
                    ? { text: "Correct", cls: "text-emerald-500" }
                    : ans?.timedOut
                    ? { text: "Timed out", cls: "text-amber-500" }
                    : ans?.selectedIndex === null
                    ? { text: "Skipped", cls: "text-amber-500" }
                    : { text: "Incorrect", cls: "text-rose-500" };
                  return (
                    <li key={q.id ?? i} className={`${theme.soft} rounded-2xl p-4`}>
                      <p className="mb-1.5 text-sm font-medium">
                        <span className={theme.textFaint}>{i + 1}.</span> {q.prompt}
                      </p>
                      <p className={`text-xs font-bold ${status.cls}`}>{status.text}</p>
                      {ans?.selectedIndex != null && !ans.isCorrect && q.answers?.[ans.selectedIndex] && (
                        <p className={`mt-1 text-xs ${theme.textSoft}`}>
                          You chose: <span className="font-semibold">{q.answers[ans.selectedIndex]}</span>
                        </p>
                      )}
                      {!ans?.isCorrect && q.answers?.[q.correctIndex] && (
                        <p className={`mt-1 text-xs ${theme.textSoft}`}>
                          Correct answer: <span className="font-semibold">{q.answers[q.correctIndex]}</span>
                        </p>
                      )}
                      {!ans?.isCorrect && q.explanation && (
                        <p className={`mt-1 text-xs leading-5 ${theme.textSoft}`}>{q.explanation}</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    );
  }

  /* ---------------- DASHBOARD SHELL ---------------- */

  const rankProgress = getRankProgress(stats?.xp || 0);
  const todayKey = getTodayKey();
  const playedToday = Boolean(stats?.streakDates?.includes(todayKey));
  const streak = stats?.currentStreak || 0;
  const coachLine = !user
    ? "Sign in to save your XP and appear on the leaderboard."
    : !stats?.attempts
    ? "Take your first challenge to start earning XP."
    : playedToday
    ? "You've played today. Come back tomorrow to keep your streak going."
    : streak > 0
    ? `Play today to keep your ${streak}-day streak alive.`
    : "A few questions a day adds up quickly.";

  return (
    <div className={`min-h-screen md:pt-20 ${theme.page}`}>
      {startingOverlay}
      <div className="px-4 py-5 md:px-6 md:py-8 lg:px-8">
        {noticeBar}

        <section className={`${theme.banner} mb-6 rounded-[28px] p-5 md:p-7`}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/10 text-xl font-bold text-white">
                {stats?.avatar ? (
                  <img src={stats.avatar} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                ) : (
                  initialsOf(stats?.name)
                )}
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-semibold text-white md:text-3xl">{stats?.name || "Student"}</h1>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-[#12182B]"
                    style={{ background: getRankColor(stats?.rank) }}
                  >
                    <Medal size={12} /> {stats?.rank || "Bronze"}
                  </span>
                  {streak > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-300">
                      <Flame size={13} /> {streak} day streak
                    </span>
                  )}
                </div>
                <p className="mt-2 max-w-md text-sm text-white/70">{coachLine}</p>
              </div>
            </div>

            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
              {user && !playedToday ? (
                <button
                  type="button"
                  disabled={starting}
                  onClick={() => handleStartQuiz(CHALLENGE_CATEGORIES[0])}
                  className={`inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-[#12182B] transition hover:bg-white/90 disabled:opacity-70 ${FOCUS_RING}`}
                >
                  {starting ? <Loader2 size={16} className="animate-spin" /> : <Flame size={16} />}
                  Play today's challenge
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveTab("categories")}
                  className={`inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-[#12182B] transition hover:bg-white/90 ${FOCUS_RING}`}
                >
                  Pick a challenge <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>

          <dl className="mt-6 grid grid-cols-3 gap-3">
            {[
              { label: "XP", value: (stats?.xp || 0).toLocaleString(), tone: "#A89CFF" },
              { label: "Accuracy", value: `${stats?.accuracy || 0}%`, tone: "#3FC1A8" },
              { label: "Attempts", value: stats?.attempts || 0, tone: "#E8BC47" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3">
                <dt className="text-xs text-white/50">{s.label}</dt>
                <dd className="text-xl font-bold tabular-nums md:text-2xl" style={{ color: s.tone }}>
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-5">
            <div
              className="h-1.5 w-full overflow-hidden rounded-full bg-white/15"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={rankProgress.pct}
              aria-label="Progress to next rank"
            >
              <div className="h-full rounded-full bg-[#8B7FEF] transition-all duration-700" style={{ width: `${rankProgress.pct}%` }} />
            </div>
            <p className="mt-1.5 text-xs text-white/60">
              {rankProgress.next ? `${rankProgress.needed.toLocaleString()} XP to ${rankProgress.next}` : "You've reached the top tier."}
            </p>
          </div>
        </section>

        <div role="tablist" aria-label="Challenge sections" className={`mb-6 flex gap-1 overflow-x-auto border-b [scrollbar-width:none] ${theme.ledgerLine}`}>
          {tabItems.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-semibold transition-colors ${FOCUS_RING} ${
                  isActive ? "" : `${theme.textSoft} hover:opacity-80`
                }`}
                style={isActive ? { color: "#6C5CE7" } : undefined}
              >
                <Icon size={15} />
                {tab.label}
                {isActive && <span className="absolute -bottom-px left-0 right-0 h-[2px] rounded-full bg-[#6C5CE7]" />}
              </button>
            );
          })}
        </div>

        <div role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
          {activeTab === "dashboard" && (
            <ChallengeOverviewPage
              theme={theme}
              stats={stats}
              history={history}
              handleStartQuiz={handleStartQuiz}
              getRankColor={getRankColor}
              getStatusColor={getStatusColor}
              dark={dark}
              challengeCategories={CHALLENGE_CATEGORIES}
            />
          )}

          {activeTab === "categories" && (
            <ChallengeCategoriesPage theme={theme} stats={stats} handleStartQuiz={handleStartQuiz} challengeCategories={CHALLENGE_CATEGORIES} />
          )}

          {activeTab === "leaderboard" && (
            <ChallengeLeaderboardPage
              theme={theme}
              leaderboard={leaderboard}
              loading={lbLoading && lbAll.length === 0}
              leaderboardScope={leaderboardScope}
              setLeaderboardScope={setLeaderboardScope}
              fetchLeaderboard={fetchLeaderboard}
              getRankColor={getRankColor}
              currentUserId={auth.currentUser?.uid}
            />
          )}

          {activeTab === "achievements" && <ChallengeAchievementsPage theme={theme} achievements={achievements} />}

          {activeTab === "history" && <ChallengeHistoryPage theme={theme} history={history} getStatusColor={getStatusColor} />}
        </div>
      </div>
    </div>
  );
}