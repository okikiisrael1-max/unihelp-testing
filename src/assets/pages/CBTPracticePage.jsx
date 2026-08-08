import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft, ArrowRight, Award, BookOpen, CheckCircle2, XCircle, Circle,
  Clock3, Flag, Maximize2, Minimize2, Sparkles, Target, Trophy, Zap,
  Loader2, Search, AlertTriangle, User, ChevronRight, ListChecks,
  MinusCircle, RotateCcw, ShieldCheck,
  History,
  Computer
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Palette status helpers
// ---------------------------------------------------------------------------
const STATUS = {
  NOT_VISITED: 'not-visited',
  NOT_ANSWERED: 'not-answered',
  ANSWERED: 'answered',
  MARKED: 'marked',
  ANSWERED_MARKED: 'answered-marked',
};

const STATUS_META = {
  [STATUS.NOT_VISITED]: { label: 'Not visited', dot: 'bg-slate-400' },
  [STATUS.NOT_ANSWERED]: { label: 'Not answered', dot: 'bg-rose-500' },
  [STATUS.ANSWERED]: { label: 'Answered', dot: 'bg-indigo-500' },
  [STATUS.MARKED]: { label: 'Marked for review', dot: 'bg-violet-500' },
  [STATUS.ANSWERED_MARKED]: { label: 'Answered & marked', dot: 'bg-violet-500' },
};

function formatClock(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const CBTPracticePage = ({ dark = false }) => {
  // ---- Data -----------------------------------------------------------
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // ---- Navigation / stage -----------------------------------------------
  // stage: 'browse' | 'setup' | 'instructions' | 'exam' | 'results' | 'history'
  const [stage, setStage] = useState('browse');
  const [searchTerm, setSearchTerm] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  // ---- Setup ------------------------------------------------------------
  const [setupCourse, setSetupCourse] = useState(null);
  const [numQuestions, setNumQuestions] = useState(20);
  const [timeLimit, setTimeLimit] = useState(18); // minutes
  const [candidateName, setCandidateName] = useState('');
  const [agreed, setAgreed] = useState(false);

  // ---- Active session -----------------------------------------------------
  const [activeCourse, setActiveCourse] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});     // { [index]: optionString }
  const [markedForReview, setMarkedForReview] = useState({}); // { [index]: true }
  const [visited, setVisited] = useState({});      // { [index]: true }
  const [timeLeft, setTimeLeft] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submittedAt, setSubmittedAt] = useState(null);
  const [startedAt, setStartedAt] = useState(null);
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const [showPaletteMobile, setShowPaletteMobile] = useState(false);

  // ---- Results / review ---------------------------------------------------
  const [reviewFilter, setReviewFilter] = useState('all'); // all | correct | incorrect | skipped
  const [reviewIndex, setReviewIndex] = useState(0);

  // ---- History -----------------------------------------------------------
  const [history, setHistory] = useState([]);

  const timerRef = useRef(null);

  // -------------------------------------------------------------------
  // Load courses
  // -------------------------------------------------------------------
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('https://taired-cbt.puter.site/api/v1/courses.json');
        const data = await response.json();
        if (data.status === 'success') {
          setCourses(data.courses);
        } else {
          setLoadError(true);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  // -------------------------------------------------------------------
  // Load history
  // -------------------------------------------------------------------
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cbt_history');
      if (saved) setHistory(JSON.parse(saved));
    } catch (e) { /* ignore */ }
  }, [showHistory, stage]);

  // -------------------------------------------------------------------
  // Countdown — only ticks during the exam stage
  // -------------------------------------------------------------------
  useEffect(() => {
    if (stage !== 'exam') return undefined;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [stage]);

  // Auto-submit when the clock hits zero
  useEffect(() => {
    if (stage === 'exam' && timeLeft === 0 && startedAt) {
      setAutoSubmitted(true);
      finishExam();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, stage]);

  // Warn before leaving mid-exam
  useEffect(() => {
    const handler = (e) => {
      if (stage === 'exam') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [stage]);

  // -------------------------------------------------------------------
  // Derived data
  // -------------------------------------------------------------------
  const filteredCourses = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return courses.filter(
      (c) => c.title.toLowerCase().includes(term) || c.id.toLowerCase().includes(term)
    );
  }, [courses, searchTerm]);

  const currentQuestion = questions[currentIndex] || null;

  const statusFor = useCallback(
    (index) => {
      const isAnswered = Boolean(answers[index]);
      const isMarked = Boolean(markedForReview[index]);
      const isVisited = Boolean(visited[index]);
      if (isAnswered && isMarked) return STATUS.ANSWERED_MARKED;
      if (isMarked) return STATUS.MARKED;
      if (isAnswered) return STATUS.ANSWERED;
      if (isVisited) return STATUS.NOT_ANSWERED;
      return STATUS.NOT_VISITED;
    },
    [answers, markedForReview, visited]
  );

  const counts = useMemo(() => {
    const base = { [STATUS.NOT_VISITED]: 0, [STATUS.NOT_ANSWERED]: 0, [STATUS.ANSWERED]: 0, [STATUS.MARKED]: 0, [STATUS.ANSWERED_MARKED]: 0 };
    questions.forEach((_, idx) => {
      base[statusFor(idx)] += 1;
    });
    return base;
  }, [questions, statusFor]);

  const answeredCount = counts[STATUS.ANSWERED] + counts[STATUS.ANSWERED_MARKED];
  const progressPercent = questions.length ? ((currentIndex + 1) / questions.length) * 100 : 0;

  const score = useMemo(() => {
    return questions.reduce((acc, q, idx) => (answers[idx] === q.correctAnswer ? acc + 1 : acc), 0);
  }, [questions, answers]);

  const completionPercent = questions.length ? Math.round((score / questions.length) * 100) : 0;

  const reviewList = useMemo(() => {
    return questions.map((q, idx) => {
      const selected = answers[idx];
      const isSkipped = !selected;
      const isCorrect = selected === q.correctAnswer;
      return { q, idx, selected, isSkipped, isCorrect };
    });
  }, [questions, answers]);

  const filteredReviewList = useMemo(() => {
    if (reviewFilter === 'correct') return reviewList.filter((r) => r.isCorrect);
    if (reviewFilter === 'incorrect') return reviewList.filter((r) => !r.isCorrect && !r.isSkipped);
    if (reviewFilter === 'skipped') return reviewList.filter((r) => r.isSkipped);
    return reviewList;
  }, [reviewList, reviewFilter]);

  // -------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------
  const beginSetup = (courseId) => {
    const course = courses.find((c) => c.id === courseId);
    setSetupCourse(courseId);
    setNumQuestions(Math.min(20, course?.question_count || 20));
    setTimeLimit(18);
    setStage('setup');
  };

  const proceedToInstructions = () => {
    setAgreed(false);
    setStage('instructions');
  };

  const startExam = async () => {
    const course = courses.find((c) => c.id === setupCourse);
    if (!course) return;
    setLoadingQuestions(true);
    setStage('exam');
    try {
      const response = await fetch(course.endpoint);
      const data = await response.json();
      if (data.status === 'success') {
        const shuffled = [...data.data].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, numQuestions);
        const formatted = selected.map((q) => {
          const options = [];
          if (q.a) options.push(q.a);
          if (q.b) options.push(q.b);
          if (q.c) options.push(q.c);
          if (q.d) options.push(q.d);
          if (q.e) options.push(q.e);
          const correctKey = q.correct?.toLowerCase();
          const correctAnswer = correctKey && q[correctKey] ? q[correctKey] : '';
          return {
            id: Math.random().toString(36).substring(7),
            courseTitle: course.title,
            question: q.question,
            options,
            correctAnswer,
            explanation: q.explanation || 'No explanation available for this question.',
          };
        });
        setActiveCourse(course);
        setQuestions(formatted);
        setCurrentIndex(0);
        setAnswers({});
        setMarkedForReview({});
        setVisited({ 0: true });
        setAutoSubmitted(false);
        const seconds = timeLimit * 60;
        setTimeLeft(seconds);
        setStartedAt(Date.now());
      } else {
        setStage('setup');
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      setStage('setup');
    } finally {
      setLoadingQuestions(false);
    }
  };

  const goToQuestion = (index) => {
    setCurrentIndex(index);
    setVisited((prev) => ({ ...prev, [index]: true }));
    setShowPaletteMobile(false);
  };

  const selectOption = (option) => {
    setAnswers((prev) => ({ ...prev, [currentIndex]: option }));
  };

  const clearResponse = () => {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[currentIndex];
      return next;
    });
  };

  const toggleMarkForReview = () => {
    setMarkedForReview((prev) => ({ ...prev, [currentIndex]: !prev[currentIndex] }));
  };

  const saveAndNext = () => {
    if (currentIndex < questions.length - 1) {
      goToQuestion(currentIndex + 1);
    }
  };

  const goBack = () => {
    if (currentIndex > 0) goToQuestion(currentIndex - 1);
  };

  const finishExam = () => {
    clearInterval(timerRef.current);
    setSubmittedAt(Date.now());
    setStage('results');
    setReviewFilter('all');
    setReviewIndex(0);
    try {
      const savedHistory = JSON.parse(localStorage.getItem('cbt_history')) || [];
      const result = {
        courseTitle: activeCourse?.title,
        score,
        totalQuestions: questions.length,
        date: new Date().toISOString(),
      };
      savedHistory.unshift(result);
      localStorage.setItem('cbt_history', JSON.stringify(savedHistory.slice(0, 50)));
    } catch (e) {
      console.error('Failed to save history', e);
    }
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const requestSubmit = () => setShowSubmitConfirm(true);

  const resetAll = () => {
    setStage('browse');
    setSetupCourse(null);
    setActiveCourse(null);
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers({});
    setMarkedForReview({});
    setVisited({});
    setShowSubmitConfirm(false);
    setAutoSubmitted(false);
    setCandidateName('');
    setAgreed(false);
  };

  const retakeSameCourse = () => {
    setStage('setup');
    setShowSubmitConfirm(false);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const getEncouragement = () => {
    if (completionPercent >= 80) return 'Excellent work — you are clearly exam-ready.';
    if (completionPercent >= 60) return 'Great effort. You are building strong momentum.';
    if (completionPercent >= 40) return 'Solid attempt. A few more sessions will sharpen this.';
    return 'Every attempt helps. Review your misses and try again.';
  };

  // -------------------------------------------------------------------
  // Shared shell classes
  // -------------------------------------------------------------------
  const pageBg = dark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900';
  const cardBg = dark ? 'border-slate-800 bg-slate-900/95' : 'border-slate-200 bg-white';
  const subtleBg = dark ? 'border-slate-800 bg-slate-950/70' : 'border-slate-200 bg-slate-50';
  const inputBg = dark
    ? 'border-slate-700 bg-slate-800 text-slate-100 focus:border-indigo-500'
    : 'border-slate-300 bg-white text-slate-900 focus:border-indigo-500';
  const ghostBtn = dark
    ? 'border-slate-700 bg-slate-800 text-slate-100 hover:border-slate-500'
    : 'border-slate-300 bg-white text-slate-900 hover:border-slate-400';

  // =====================================================================
  // LOADING (initial course list)
  // =====================================================================
  if (loading) {
    return (
      <div className={`min-h-screen px-4 mt-4 md:mt-24 pb-12 flex flex-col items-center justify-center gap-3 ${pageBg}`}>
        <Loader2 className="animate-spin text-indigo-500" size={36} />
        <p className="text-sm font-mono tracking-widest uppercase opacity-60">Loading course bank…</p>
      </div>
    );
  }

  if (loadError && courses.length === 0) {
    return (
      <div className={`min-h-screen px-4 mt-4 md:mt-24 pb-12 flex flex-col items-center justify-center gap-3 text-center ${pageBg}`}>
        <AlertTriangle size={36} className="text-rose-500" />
        <p className="font-semibold">Could not reach the question bank.</p>
        <p className="text-sm opacity-70">Check your connection and reload the page.</p>
      </div>
    );
  }

  // =====================================================================
  // HISTORY
  // =====================================================================
  if (showHistory) {
    return (
      <div className={`min-h-screen px-4 mt-4 md:mt-24 pb-12 sm:px-6 lg:px-8 flex items-center justify-center ${pageBg}`}>
        <div className={`w-full max-w-2xl rounded-[28px] border p-6 sm:p-8 shadow-2xl max-h-[80vh] flex flex-col ${cardBg}`}>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.3em] text-indigo-500 mb-1">Candidate record</p>
              <h2 className="text-2xl font-bold">Performance History</h2>
            </div>
            <button
              onClick={() => setShowHistory(false)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${ghostBtn}`}
            >
              <ArrowLeft size={16} />
              Back
            </button>
          </div>

          <div className="overflow-y-auto pr-2 space-y-3">
            {history.length === 0 ? (
              <p className="opacity-70 text-center py-8">No sessions recorded yet. Complete a practice run to see it here.</p>
            ) : (
              history.map((item, idx) => {
                const percent = Math.round((item.score / item.totalQuestions) * 100);
                const tone = percent >= 70 ? 'text-indigo-500 bg-indigo-500/10' : percent >= 40 ? 'text-amber-500 bg-amber-500/10' : 'text-rose-500 bg-rose-500/10';
                return (
                  <div key={idx} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border p-4 ${subtleBg}`}>
                    <div>
                      <h3 className="font-bold text-lg">{item.courseTitle}</h3>
                      <p className="text-sm opacity-70 mt-1 font-mono">
                        {new Date(item.date).toLocaleDateString()} · {new Date(item.date).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-wide opacity-60">Score</p>
                        <p className="font-bold font-mono">{item.score} / {item.totalQuestions}</p>
                      </div>
                      <div className={`flex items-center justify-center h-12 w-12 rounded-full font-bold font-mono ${tone}`}>
                        {percent}%
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  // =====================================================================
  // BROWSE COURSES
  // =====================================================================
  if (stage === 'browse') {
    return (
      <div className={`min-h-screen px-4 mt-4 md:mt-20 mb-12 sm:px-6 lg:px-8 ${pageBg}`}>
        <div className={`mx-auto max-w-5xl rounded-[28px] border p-6 sm:p-8 shadow-2xl ${cardBg}`}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-indigo-600/15 p-3 text-indigo-500">
                <Computer size={30} />
              </div>
              <div className='flex flex-col gap-3'>
                <p className="text-xs font-mono font-semibold uppercase tracking-[0.3em] text-indigo-500">CBT practice terminal</p>
                <h1 className="text-2xl font-bold">Select a subject to begin</h1>
              </div>
            </div>

            {history.length > 0 && (
              <button onClick={() => setShowHistory(true)} className={`flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm ml-auto font-semibold transition ${ghostBtn}`}>
                <History size={16} className="text-red-500" />
                <span className="inline">View history</span>
              </button>)}
          </div>
          <p className="text-sm leading-6 opacity-80 mb-8 max-w-2xl">Pick a subject, configure your session, then sit a timed mock exactly like the real CBT, mark-for-review, and a strict clock included.
          </p>

          <div className="mb-6 relative max-w-md">
            <input
              type="text"
              placeholder="Search for a subject…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full rounded-2xl border px-4 py-3 pl-11 outline-none transition ${inputBg}`}
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" size={18} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                onClick={() => beginSetup(course.id)}
                className={`group cursor-pointer rounded-2xl border p-5 transition-all hover:scale-[1.02] ${
                  dark
                    ? 'border-slate-700 bg-slate-800 hover:border-indigo-500 hover:bg-indigo-500/5'
                    : 'border-slate-200 bg-slate-50 hover:border-indigo-500 hover:shadow-lg hover:bg-white'
                }`}
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className={`rounded-xl p-2.5 transition-colors ${dark ? 'bg-slate-700 text-indigo-400 group-hover:bg-indigo-500/20' : 'bg-slate-200 text-indigo-600 group-hover:bg-indigo-50'}`}>
                    <BookOpen size={20}/>
                  </div>
                  <ChevronRight size={18} className="opacity-0 group-hover:opacity-60 transition-opacity mt-1" />
                </div>
                <h3 className="mb-2 text-lg font-bold">{course.title}</h3>
                <div className="flex items-center gap-2 text-sm font-mono font-medium opacity-70">
                  <Target size={14} />
                  <span>{course.question_count} questions available</span>
                </div>
              </div>
            ))}
            {filteredCourses.length === 0 && (
              <p className="col-span-full text-center opacity-60 py-8">No subjects match "{searchTerm}".</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =====================================================================
  // SETUP
  // =====================================================================
  if (stage === 'setup') {
    const course = courses.find((c) => c.id === setupCourse);
    return (
      <div className={`min-h-screen px-4 pt-24 pb-12 sm:px-6 lg:px-8 flex items-center justify-center ${pageBg}`}>
        <div className={`w-full max-w-md rounded-[28px] border p-8 shadow-2xl ${cardBg}`}>
          <div className="mb-6">
            <p className="text-xs font-mono uppercase tracking-[0.3em] text-indigo-500 mb-1">Step 1 of 2</p>
            <h2 className="text-2xl font-bold mb-2">Session setup</h2>
            <p className="text-sm opacity-70">Configure your {course?.title} practice session.</p>
          </div>

          <div className="space-y-5 mb-8">
            <div>
              <label className="text-sm font-medium mb-2 block">Number of questions</label>
              <input
                type="number"
                min="5"
                max={course?.question_count || 100}
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
                className={`w-full rounded-2xl border px-4 py-3 outline-none transition ${inputBg}`}
              />
              <p className="text-xs opacity-60 mt-2 font-mono">Maximum available: {course?.question_count}</p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Time limit (minutes)</label>
              <input
                type="number"
                min="1"
                max="180"
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value))}
                className={`w-full rounded-2xl border px-4 py-3 outline-none transition ${inputBg}`}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Candidate name <span className="opacity-50 font-normal">(optional)</span></label>
              <input
                type="text"
                placeholder="e.g. Ada Lovelace"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                className={`w-full rounded-2xl border px-4 py-3 outline-none transition ${inputBg}`}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setStage('browse'); setSetupCourse(null); }}
              className={`flex-1 rounded-2xl border px-4 py-3 font-semibold transition ${ghostBtn}`}
            >
              Cancel
            </button>
            <button
              onClick={proceedToInstructions}
              className="flex-1 rounded-2xl bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-500 shadow-lg shadow-indigo-500/30"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================================
  // INSTRUCTIONS
  // =====================================================================
  if (stage === 'instructions') {
    const course = courses.find((c) => c.id === setupCourse);
    const rules = [
      `This session has ${numQuestions} questions and a strict time limit of ${timeLimit} minute${timeLimit === 1 ? '' : 's'}.`,
      'The countdown starts the moment you click "Start exam" and cannot be paused.',
      'Use the question palette to jump between questions at any time.',
      'Choose "Mark for review" to flag a question you want to revisit — it does not clear your selected answer.',
      'You will not see whether an answer is correct until you submit the exam.',
      'The exam auto-submits when the clock reaches zero, using whatever answers you have selected.',
      'Leaving full screen or closing the tab does not stop the timer.',
    ];
    return (
      <div className={`min-h-screen px-4 pt-24 pb-12 sm:px-6 lg:px-8 flex items-center justify-center ${pageBg}`}>
        <div className={`w-full max-w-2xl rounded-[28px] border p-6 sm:p-8 shadow-2xl ${cardBg}`}>
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-amber-500/15 p-3 text-amber-500">
              <ShieldCheck size={22} />
            </div>
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.3em] text-indigo-500 mb-1">Step 2 of 2</p>
              <h2 className="text-2xl font-bold">Exam instructions</h2>
            </div>
          </div>

          <div className={`mb-5 grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-2xl border p-4 text-sm ${subtleBg}`}>
            <div>
              <p className="text-xs uppercase tracking-wide opacity-60">Subject</p>
              <p className="font-semibold truncate">{course?.title}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide opacity-60">Questions</p>
              <p className="font-semibold font-mono">{numQuestions}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide opacity-60">Time limit</p>
              <p className="font-semibold font-mono">{timeLimit} min</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide opacity-60">Candidate</p>
              <p className="font-semibold truncate">{candidateName || 'Guest'}</p>
            </div>
          </div>

          <ul className="space-y-3 mb-6">
            {rules.map((rule, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm leading-6">
                <span className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-mono font-bold ${dark ? 'bg-slate-800 text-indigo-400' : 'bg-slate-100 text-indigo-600'}`}>
                  {idx + 1}
                </span>
                <span className="opacity-90">{rule}</span>
              </li>
            ))}
          </ul>

          <label className={`mb-6 flex items-start gap-3 rounded-2xl border p-4 cursor-pointer ${subtleBg}`}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-indigo-600"
            />
            <span className="text-sm leading-6">
              I have read and understood the instructions above, and I am ready to begin the timed exam.
            </span>
          </label>

          <div className="flex gap-3">
            <button
              onClick={() => setStage('setup')}
              className={`flex-1 rounded-2xl border px-4 py-3 font-semibold transition ${ghostBtn}`}
            >
              Back
            </button>
            <button
              onClick={startExam}
              disabled={!agreed}
              className="flex-1 rounded-2xl bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-500 shadow-lg shadow-indigo-500/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              Start exam
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================================
  // EXAM (loading questions)
  // =====================================================================
  if (stage === 'exam' && (loadingQuestions || questions.length === 0)) {
    return (
      <div className={`min-h-screen px-4 pt-24 pb-12 flex flex-col items-center justify-center gap-3 ${pageBg}`}>
        <Loader2 className="animate-spin text-indigo-500" size={40} />
        <p className="font-mono text-sm uppercase tracking-widest animate-pulse opacity-70">Preparing your exam…</p>
      </div>
    );
  }

  // =====================================================================
  // EXAM (live)
  // =====================================================================
  if (stage === 'exam') {
    const urgent = timeLeft <= 60;
    const warn = timeLeft <= 300 && !urgent;

    const PaletteGrid = ({ compact = false }) => (
      <div className={`grid gap-2 ${compact ? 'grid-cols-6' : 'grid-cols-5'}`}>
        {questions.map((q, index) => {
          const status = statusFor(index);
          const isActive = index === currentIndex;
          const meta = STATUS_META[status];
          return (
            <button
              key={q.id}
              onClick={() => goToQuestion(index)}
              className={`relative h-10 w-10 rounded-xl border text-sm font-mono font-semibold transition flex items-center justify-center ${
                isActive
                  ? 'border-indigo-500 bg-indigo-600 text-white ring-2 ring-indigo-500/40'
                  : status === STATUS.ANSWERED || status === STATUS.ANSWERED_MARKED
                  ? 'border-indigo-500/60 bg-indigo-500/10 text-indigo-600'
                  : status === STATUS.MARKED
                  ? 'border-violet-500/60 bg-violet-500/10 text-violet-600'
                  : status === STATUS.NOT_ANSWERED
                  ? 'border-rose-500/60 bg-rose-500/10 text-rose-600'
                  : dark
                  ? 'border-slate-700 bg-slate-900 text-slate-400'
                  : 'border-slate-300 bg-white text-slate-500'
              }`}
            >
              {index + 1}
              {status === STATUS.ANSWERED_MARKED && (
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-indigo-500 border-2 border-white" />
              )}
            </button>
          );
        })}
      </div>
    );

    const Legend = () => (
      <div className="grid grid-cols-2 gap-2 text-xs">
        {Object.entries(STATUS_META).map(([key, meta]) => (
          <div key={key} className="flex items-center gap-2 opacity-80">
            <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
            <span>{meta.label}</span>
          </div>
        ))}
      </div>
    );

    return (
      <div className={`min-h-screen px-3 pt-20 pb-6 sm:px-6 lg:px-8 ${pageBg}`}>
        <div className="mx-auto max-w-7xl">
          {/* Exam header bar */}
          <div className={`mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 sm:px-6 sm:py-4 ${cardBg}`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="rounded-xl bg-indigo-600/15 p-2.5 text-indigo-500 flex-shrink-0">
                <BookOpen size={20}/>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-mono uppercase tracking-[0.2em] text-indigo-500">{activeCourse?.title}</p>
                <p className="text-sm font-semibold truncate">{candidateName ? `Candidate: ${candidateName}` : 'Guest candidate'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`flex items-center gap-2 rounded-xl border px-4 py-2 font-mono text-lg font-bold tabular-nums ${
                  urgent
                    ? 'border-rose-500 bg-rose-500/10 text-rose-600 animate-pulse'
                    : warn
                    ? 'border-amber-500 bg-amber-500/10 text-amber-600'
                    : subtleBg
                }`}
              >
                <Clock3 size={18} />
                {formatClock(timeLeft)}
              </div>
              <button
                onClick={toggleFullscreen}
                className={`hidden sm:flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${ghostBtn}`}
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button
                onClick={() => setShowPaletteMobile(true)}
                className={`lg:hidden flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${ghostBtn}`}
              >
                <ListChecks size={16} />
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className={`mb-4 rounded-2xl border p-3 sm:p-4 ${subtleBg}`}>
            <div className="mb-2 flex items-center justify-between text-xs sm:text-sm font-mono">
              <span>Question {currentIndex + 1} of {questions.length}</span>
              <span className="text-indigo-500 font-semibold">{answeredCount} answered</span>
            </div>
            <div className={`h-2 w-full overflow-hidden rounded-full ${dark ? 'bg-slate-800' : 'bg-slate-200'}`}>
              <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            {/* Question panel */}
            <div className={`rounded-[28px] border p-5 shadow-sm sm:p-6 ${cardBg}`}>
              <div className="mb-5 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-indigo-600/10 px-3 py-1 font-mono font-medium text-indigo-600">
                  Q{currentIndex + 1}
                </span>
                {markedForReview[currentIndex] && (
                  <span className="flex items-center gap-1 rounded-full bg-violet-500/10 px-3 py-1 font-medium text-violet-600">
                    <Flag size={12} /> Marked for review
                  </span>
                )}
              </div>

              <h2 className="text-lg sm:text-xl font-semibold leading-8 mb-6">{currentQuestion.question}</h2>

              <div className="space-y-3">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = answers[currentIndex] === option;
                  return (
                    <button
                      key={`${option}-${idx}`}
                      onClick={() => selectOption(option)}
                      className={`flex w-full items-start rounded-2xl border px-4 py-3.5 text-left transition ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300'
                          : dark
                          ? 'border-slate-700 bg-slate-900 hover:border-slate-500'
                          : 'border-slate-200 bg-white hover:border-slate-400'
                      }`}
                    >
                      <span
                        className={`mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-mono font-bold ${
                          isSelected ? 'bg-indigo-600 text-white' : dark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="leading-6">{option}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex flex-wrap gap-2 sm:gap-3">
                <button
                  onClick={goBack}
                  disabled={currentIndex === 0}
                  className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${ghostBtn}`}
                >
                  <ArrowLeft size={16} />
                  Previous
                </button>
                <button
                  onClick={clearResponse}
                  disabled={!answers[currentIndex]}
                  className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${ghostBtn}`}
                >
                  <MinusCircle size={16} />
                  Clear response
                </button>
                <button
                  onClick={toggleMarkForReview}
                  className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 font-semibold transition ${
                    markedForReview[currentIndex]
                      ? 'border-violet-500 bg-violet-500/10 text-violet-600'
                      : ghostBtn
                  }`}
                >
                  <Flag size={16} />
                  {markedForReview[currentIndex] ? 'Marked' : 'Mark for review'}
                </button>

                <div className="flex-1" />

                {currentIndex < questions.length - 1 ? (
                  <button
                    onClick={saveAndNext}
                    className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2.5 font-semibold text-white transition hover:bg-indigo-500"
                  >
                    Save &amp; next
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    onClick={requestSubmit}
                    className="flex items-center gap-2 rounded-2xl bg-rose-600 px-5 py-2.5 font-semibold text-white transition hover:bg-rose-500"
                  >
                    Submit exam
                  </button>
                )}
              </div>
            </div>

            {/* Palette sidebar - desktop */}
            <div className={`hidden lg:flex lg:flex-col gap-4 rounded-[28px] border p-5 shadow-sm h-fit sticky top-24 ${cardBg}`}>
              <div>
                <p className="text-xs font-mono uppercase tracking-[0.2em] text-indigo-500 mb-3">Question palette</p>
                <PaletteGrid />
              </div>
              <div className={`rounded-2xl border p-3 ${subtleBg}`}>
                <Legend />
              </div>
              <button
                onClick={requestSubmit}
                className="mt-1 flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 font-semibold text-white transition hover:bg-rose-500"
              >
                Submit exam
              </button>
            </div>
          </div>
        </div>

        {/* Palette drawer - mobile */}
        {showPaletteMobile && (
          <div className="fixed inset-0 z-50 flex items-end lg:hidden">
            <div className="absolute inset-0 bg-slate-950/60" onClick={() => setShowPaletteMobile(false)} />
            <div className={`relative w-full rounded-t-[28px] border-t p-5 max-h-[75vh] overflow-y-auto ${cardBg}`}>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs font-mono uppercase tracking-[0.2em] text-indigo-500">Question palette</p>
                <button onClick={() => setShowPaletteMobile(false)} className="text-sm font-semibold opacity-70">Close</button>
              </div>
              <PaletteGrid compact />
              <div className={`mt-4 rounded-2xl border p-3 ${subtleBg}`}>
                <Legend />
              </div>
              <button
                onClick={requestSubmit}
                className="mt-4 w-full flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 font-semibold text-white transition hover:bg-rose-500"
              >
                Submit exam
              </button>
            </div>
          </div>
        )}

        {/* Submit confirmation modal */}
        {showSubmitConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4">
            <div className={`w-full max-w-md rounded-[28px] border p-6 shadow-2xl ${dark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-2xl bg-amber-500/15 p-3 text-amber-500">
                  <AlertTriangle size={22} />
                </div>
                <h2 className="text-xl font-bold">Submit this exam?</h2>
              </div>
              <p className="text-sm opacity-80 mb-4">You can't change your answers after submitting. Here's your current status:</p>
              <div className="grid grid-cols-2 gap-2 mb-6 text-sm">
                <div className={`rounded-xl border p-3 ${subtleBg}`}>
                  <p className="opacity-60 text-xs uppercase">Answered</p>
                  <p className="font-mono font-bold text-indigo-500">{answeredCount}</p>
                </div>
                <div className={`rounded-xl border p-3 ${subtleBg}`}>
                  <p className="opacity-60 text-xs uppercase">Not answered</p>
                  <p className="font-mono font-bold text-rose-500">{counts[STATUS.NOT_ANSWERED] + counts[STATUS.NOT_VISITED]}</p>
                </div>
                <div className={`rounded-xl border p-3 ${subtleBg}`}>
                  <p className="opacity-60 text-xs uppercase">Marked for review</p>
                  <p className="font-mono font-bold text-violet-500">{counts[STATUS.MARKED] + counts[STATUS.ANSWERED_MARKED]}</p>
                </div>
                <div className={`rounded-xl border p-3 ${subtleBg}`}>
                  <p className="opacity-60 text-xs uppercase">Time left</p>
                  <p className="font-mono font-bold">{formatClock(timeLeft)}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSubmitConfirm(false)}
                  className={`flex-1 rounded-2xl border px-4 py-3 font-semibold transition ${ghostBtn}`}
                >
                  Keep working
                </button>
                <button
                  onClick={finishExam}
                  className="flex-1 rounded-2xl bg-rose-600 px-4 py-3 font-semibold text-white transition hover:bg-rose-500"
                >
                  Submit now
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =====================================================================
  // RESULTS + REVIEW
  // =====================================================================
  if (stage === 'results') {
    const timeTakenSec = startedAt && submittedAt ? Math.round((submittedAt - startedAt) / 1000) : null;
    const activeReview = filteredReviewList[reviewIndex] || filteredReviewList[0];

    const filterTabs = [
      { key: 'all', label: 'All', count: reviewList.length },
      { key: 'correct', label: 'Correct', count: reviewList.filter((r) => r.isCorrect).length },
      { key: 'incorrect', label: 'Incorrect', count: reviewList.filter((r) => !r.isCorrect && !r.isSkipped).length },
      { key: 'skipped', label: 'Skipped', count: reviewList.filter((r) => r.isSkipped).length },
    ];

    return (
      <div className={`min-h-screen px-4 pt-24 pb-12 sm:px-6 lg:px-8 ${pageBg}`}>
        <div className="mx-auto max-w-6xl space-y-4">
          {/* Score summary */}
          <div className={`rounded-[28px] border p-6 sm:p-8 shadow-2xl ${cardBg}`}>
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="rounded-2xl bg-amber-500/15 p-3 text-amber-500">
                <Trophy size={26} />
              </div>
              <div>
                <p className="text-xs font-mono uppercase tracking-[0.3em] text-indigo-500">
                  {autoSubmitted ? 'Time up — auto-submitted' : 'Exam complete'}
                </p>
                <h1 className="text-2xl font-bold">{activeCourse?.title} results</h1>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className={`rounded-2xl border p-4 ${subtleBg}`}>
                <p className="text-xs uppercase opacity-60">Score</p>
                <p className="text-xl font-bold font-mono">{score} / {questions.length}</p>
              </div>
              <div className={`rounded-2xl border p-4 ${subtleBg}`}>
                <p className="text-xs uppercase opacity-60">Accuracy</p>
                <p className="text-xl font-bold font-mono">{completionPercent}%</p>
              </div>
              <div className={`rounded-2xl border p-4 ${subtleBg}`}>
                <p className="text-xs uppercase opacity-60">Skipped</p>
                <p className="text-xl font-bold font-mono">{reviewList.filter((r) => r.isSkipped).length}</p>
              </div>
              <div className={`rounded-2xl border p-4 ${subtleBg}`}>
                <p className="text-xs uppercase opacity-60">Time used</p>
                <p className="text-xl font-bold font-mono">{timeTakenSec !== null ? formatClock(timeTakenSec) : '—'}</p>
              </div>
            </div>

            <p className="text-sm opacity-80 mb-6">{getEncouragement()}</p>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={retakeSameCourse}
                className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2.5 font-semibold text-white transition hover:bg-indigo-500"
              >
                <RotateCcw size={16} />
                Practice again
              </button>
              <button
                onClick={resetAll}
                className={`rounded-2xl border px-5 py-2.5 font-semibold transition ${ghostBtn}`}
              >
                Choose another subject
              </button>
              {history.length > 0 && (
                <button
                  onClick={() => setShowHistory(true)}
                  className={`rounded-2xl border px-5 py-2.5 font-semibold transition ${ghostBtn}`}
                >
                  View history
                </button>
              )}
            </div>
          </div>

          {/* Detailed review */}
          <div className={`rounded-[28px] border p-5 sm:p-6 shadow-sm ${cardBg}`}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-indigo-500">Answer review</p>
              <div className="flex flex-wrap gap-2">
                {filterTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => { setReviewFilter(tab.key); setReviewIndex(0); }}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                      reviewFilter === tab.key ? 'border-indigo-500 bg-indigo-600 text-white' : ghostBtn
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>
            </div>

            {filteredReviewList.length === 0 ? (
              <p className="text-sm opacity-60 py-8 text-center">No questions in this category.</p>
            ) : (
              <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
                <div className={`rounded-2xl border p-5 ${subtleBg}`}>
                  <div className="mb-3 flex items-center gap-2 text-xs">
                    <span className="rounded-full bg-indigo-600/10 px-3 py-1 font-mono font-medium text-indigo-600">
                      Q{activeReview.idx + 1}
                    </span>
                    {activeReview.isSkipped ? (
                      <span className="flex items-center gap-1 rounded-full bg-slate-500/10 px-3 py-1 font-medium">
                        <Circle size={12} /> Skipped
                      </span>
                    ) : activeReview.isCorrect ? (
                      <span className="flex items-center gap-1 rounded-full bg-indigo-500/10 px-3 py-1 font-medium text-indigo-600">
                        <CheckCircle2 size={12} /> Correct
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-full bg-rose-500/10 px-3 py-1 font-medium text-rose-600">
                        <XCircle size={12} /> Incorrect
                      </span>
                    )}
                  </div>

                  <h3 className="text-base sm:text-lg font-semibold leading-7 mb-4">{activeReview.q.question}</h3>

                  <div className="space-y-2 mb-4">
                    {activeReview.q.options.map((option, idx) => {
                      const isCorrectOpt = option === activeReview.q.correctAnswer;
                      const isSelectedOpt = option === activeReview.selected;
                      return (
                        <div
                          key={idx}
                          className={`flex items-start rounded-xl border px-4 py-3 text-sm ${
                            isCorrectOpt
                              ? 'border-indigo-500 bg-indigo-500/10'
                              : isSelectedOpt
                              ? 'border-rose-500 bg-rose-500/10'
                              : dark
                              ? 'border-slate-700'
                              : 'border-slate-200'
                          }`}
                        >
                          <span className="mr-3 font-mono font-bold">{String.fromCharCode(65 + idx)}</span>
                          <span className="leading-6 flex-1">{option}</span>
                          {isCorrectOpt && <CheckCircle2 size={16} className="text-indigo-500 flex-shrink-0 ml-2" />}
                          {isSelectedOpt && !isCorrectOpt && <XCircle size={16} className="text-rose-500 flex-shrink-0 ml-2" />}
                        </div>
                      );
                    })}
                  </div>

                  {activeReview.q.explanation && (
                    <div className={`rounded-xl border p-4 text-sm ${dark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                      <div className="mb-1 flex items-center gap-2 font-semibold text-indigo-500">
                        <Zap size={14} />
                        <span>Explanation</span>
                      </div>
                      <p className="leading-6 opacity-80">{activeReview.q.explanation}</p>
                    </div>
                  )}

                  <div className="mt-5 flex justify-between gap-3">
                    <button
                      onClick={() => setReviewIndex((i) => Math.max(0, i - 1))}
                      disabled={reviewIndex === 0}
                      className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed ${ghostBtn}`}
                    >
                      <ArrowLeft size={14} /> Previous
                    </button>
                    <button
                      onClick={() => setReviewIndex((i) => Math.min(filteredReviewList.length - 1, i + 1))}
                      disabled={reviewIndex >= filteredReviewList.length - 1}
                      className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed ${ghostBtn}`}
                    >
                      Next <ArrowRight size={14} />
                    </button>
                  </div>
                </div>

                <div className={`rounded-2xl border p-4 h-fit ${subtleBg}`}>
                  <p className="text-xs uppercase opacity-60 mb-3">Jump to question</p>
                  <div className="grid grid-cols-5 gap-2 max-h-80 overflow-y-auto pr-1">
                    {filteredReviewList.map((r, i) => (
                      <button
                        key={r.q.id}
                        onClick={() => setReviewIndex(i)}
                        className={`h-9 w-9 rounded-lg border text-xs font-mono font-semibold transition ${
                          i === reviewIndex
                            ? 'border-indigo-500 bg-indigo-600 text-white'
                            : r.isSkipped
                            ? dark ? 'border-slate-700 text-slate-400' : 'border-slate-300 text-slate-500'
                            : r.isCorrect
                            ? 'border-indigo-500/60 bg-indigo-500/10 text-indigo-600'
                            : 'border-rose-500/60 bg-rose-500/10 text-rose-600'
                        }`}
                      >
                        {r.idx + 1}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default CBTPracticePage;