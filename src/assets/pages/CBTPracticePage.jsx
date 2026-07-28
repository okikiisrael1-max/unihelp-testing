import React, { useMemo, useState, useEffect } from 'react';
import { ArrowLeft, Award, BookOpen, Clock3, Maximize2, Minimize2, Sparkles, Target, Trophy, Zap } from 'lucide-react';
import { universityQuestionBank } from '../data/universityQuestionBank';

const LEVELS = ['100', '200', '300', '400', '500'];

const CBTPracticePage = ({ dark = false }) => {
  const [selectedLevel, setSelectedLevel] = useState('100');
  const [selectedCourse, setSelectedCourse] = useState('All');
  const [filterKey, setFilterKey] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [timeLeft, setTimeLeft] = useState(18 * 60);
  const [reviewMode, setReviewMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const filteredQuestions = useMemo(() => {
    return universityQuestionBank.filter((item) => {
      const levelMatch = selectedLevel === 'All' || item.level === selectedLevel;
      const courseMatch = selectedCourse === 'All' || item.courseCode === selectedCourse;
      return levelMatch && courseMatch;
    });
  }, [selectedLevel, selectedCourse, filterKey]);

  const courses = useMemo(() => {
    const unique = [...new Set(universityQuestionBank.map((item) => item.courseCode))];
    return ['All', ...unique];
  }, []);

  const currentQuestion = filteredQuestions[currentIndex] || null;
  const progressPercent = filteredQuestions.length ? ((currentIndex + 1) / filteredQuestions.length) * 100 : 0;
  const completionPercent = filteredQuestions.length ? (score / filteredQuestions.length) * 100 : 0;
  const answeredCount = filteredQuestions.filter((item) => item?.answer !== undefined).length;
  const questionStatus = filteredQuestions.map((item, index) => {
    const isActive = index === currentIndex;
    const isAnswered = Boolean(selectedAnswer && index === currentIndex) || Boolean(item?.answer);
    const isReviewed = reviewMode && isActive;

    return { isActive, isAnswered, isReviewed };
  });

  useEffect(() => {
    if (showSummary || filteredQuestions.length === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [showSummary, filteredQuestions.length]);

  const resetQuiz = () => {
    setSelectedLevel('100');
    setSelectedCourse('All');
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setSubmitted(false);
    setScore(0);
    setShowSummary(false);
    setReviewMode(false);
    setTimeLeft(18 * 60);
    setFilterKey((prev) => prev + 1);
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

  const handleSubmit = () => {
    if (!currentQuestion) return;
    if (selectedAnswer === null) return;

    if (selectedAnswer === currentQuestion.correctAnswer) {
      setScore((prev) => prev + 1);
    }

    setSubmitted(true);
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setSelectedAnswer(null);
      setSubmitted(false);
      setReviewMode(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < filteredQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setSubmitted(false);
      setReviewMode(false);
    } else {
      setShowSummary(true);
    }
  };

  const getEncouragement = () => {
    if (completionPercent >= 80) return 'Excellent work! You are clearly prepared.';
    if (completionPercent >= 60) return 'Great effort. You are building strong momentum.';
    if (completionPercent >= 40) return 'Nice progress. Keep practicing and you will improve.';
    return 'Every attempt helps. Keep going and stay consistent.';
  };

  if (!currentQuestion) {
    return (
      <div className={`min-h-screen px-4 py-6 sm:px-6 lg:px-8 ${dark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
        <div className={`mx-auto flex max-w-5xl flex-col rounded-[28px] border p-8 shadow-2xl ${dark ? 'border-slate-800 bg-slate-900/95' : 'border-slate-200 bg-white'}`}>
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-2xl bg-indigo-600/15 p-3 text-indigo-500">
              <Target size={22} />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-500">CBT Practice</p>
              <h1 className="text-2xl font-semibold">No questions available yet</h1>
            </div>
          </div>
          <p className="text-sm leading-6 opacity-80">
            It seems there are no questions available for the selected level and course. Please adjust your filters or check back later for more questions.
          </p>
          <button
            onClick={resetQuiz}
            className="mt-6 w-fit rounded-2xl bg-indigo-600 px-5 py-2.5 font-semibold text-white transition hover:bg-indigo-500"
          >
            Reset filters
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen px-4 py-6 sm:px-6 lg:px-8 ${dark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className={`mx-auto max-w-6xl rounded-4xl border p-4 shadow-2xl sm:p-6 lg:p-8 ${dark ? 'border-slate-800 bg-slate-900/95' : 'border-slate-200 bg-white'}`}>
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-2xl bg-indigo-600/15 p-3 text-indigo-500">
                <Sparkles size={22} />
              </div>
              <div>
                <p className="text-sm font-semibold hidden md:flex uppercase tracking-[0.3em] text-indigo-500">CBT Practice</p>
                <h1 className="text-2xl font-bold">Practice with confidence</h1>
              </div>
            </div>
            <p className="text-sm leading-6 opacity-80">
              Test your knowledge and improve your skills with our comprehensive CBT practice questions. Select your level and course to get started, and track your progress as you go.
            </p>
          </div>

          <div className={`flex flex-wrap gap-3 rounded-2xl border px-4 py-3 text-sm ${dark ? 'border-slate-800 bg-slate-950/70' : 'border-slate-200 bg-slate-100'}`}>
            <div className="flex items-center gap-2">
              <Award size={16} className="text-amber-500" />
              <span>Score {score}/{filteredQuestions.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock3 size={16} className="text-cyan-500" />
              <span>{String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Target size={16} className="text-emerald-500" />
              <span>{answeredCount} answered</span>
            </div>
          </div>
        </div>

        <div className={`mb-5 rounded-2xl border p-4 shadow-sm ${dark ? 'border-slate-800 bg-slate-950/70' : 'border-slate-200 bg-slate-50'}`}>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium">Progress</span>
            <span className="font-semibold text-indigo-500">{Math.round(progressPercent)}%</span>
          </div>
          <div className={`h-2.5 w-full overflow-hidden rounded-full ${dark ? 'bg-slate-800' : 'bg-slate-200'}`}>
            <div className="h-full rounded-full bg-linear-to-r from-indigo-500 via-violet-500 to-cyan-500" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <div className="mb-6 grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <label className="text-sm font-medium">
            <span className="mb-2 block">Level</span>
            <select
              value={selectedLevel}
              onChange={(e) => {
                setSelectedLevel(e.target.value);
                setCurrentIndex(0);
                setSelectedAnswer(null);
                setSubmitted(false);
              }}
              className={`w-full rounded-2xl border px-3 py-2.5 outline-none transition ${dark ? 'border-slate-700 bg-slate-800 text-slate-100' : 'border-slate-300 bg-white text-slate-900'}`}
            >
              {LEVELS.map((level) => (
                <option key={level} value={level}>{level} Level</option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium">
            <span className="mb-2 block">Course</span>
            <select
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value);
                setCurrentIndex(0);
                setSelectedAnswer(null);
                setSubmitted(false);
              }}
              className={`w-full rounded-2xl border px-3 py-2.5 outline-none transition ${dark ? 'border-slate-700 bg-slate-800 text-slate-100' : 'border-slate-300 bg-white text-slate-900'}`}
            >
              {courses.map((course) => (
                <option key={course} value={course}>{course}</option>
              ))}
            </select>
          </label>

          <button
            onClick={resetQuiz}
            className={`rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${dark ? 'border-slate-700 bg-slate-800 text-slate-100 hover:border-slate-500' : 'border-slate-300 bg-white text-slate-900 hover:border-slate-400'}`}
          >
            Reset filters
          </button>
        </div>

        <div className={`mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3 ${dark ? 'border-slate-800 bg-slate-950/70' : 'border-slate-200 bg-slate-50'}`}>
          <div className="flex items-center gap-2 text-sm">
            <Target size={16} className="text-indigo-500" />
            <span className="font-medium">Question navigator</span>
          </div>
          <button
            onClick={toggleFullscreen}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${dark ? 'border-slate-700 bg-slate-800 hover:border-slate-500' : 'border-slate-300 bg-white hover:border-slate-400'}`}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            {isFullscreen ? 'Exit full screen' : 'Full screen'}
          </button>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {filteredQuestions.map((question, index) => {
            const status = questionStatus[index] || {};
            return (
              <button
                key={question.id || `${question.courseCode}-${index}`}
                onClick={() => {
                  setCurrentIndex(index);
                  setSelectedAnswer(null);
                  setSubmitted(false);
                  setReviewMode(false);
                }}
                className={`h-10 w-10 rounded-xl border text-sm font-semibold transition ${
                  status.isActive
                    ? 'border-indigo-500 bg-indigo-600 text-white'
                    : status.isAnswered
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600'
                      : dark
                        ? 'border-slate-700 bg-slate-900 text-slate-300'
                        : 'border-slate-300 bg-white text-slate-700'
                }`}
              >
                {index + 1}
              </button>
            );
          })}
        </div>

        <div className={`rounded-[28px] border p-5 shadow-inner sm:p-6 ${dark ? 'border-slate-800 bg-slate-950/70' : 'border-slate-200 bg-slate-50'}`}>
          <div className="mb-5 flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full bg-indigo-600/10 px-3 py-1 font-medium text-indigo-600">{currentQuestion.courseCode}</span>
            <span className="rounded-full bg-slate-500/10 px-3 py-1">{currentQuestion.courseTitle}</span>
            <span className="rounded-full bg-amber-500/10 px-3 py-1 text-amber-600">{currentQuestion.category}</span>
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-600">{currentQuestion.topic}</span>
          </div>

          <div className="mb-5 flex items-start gap-3">
            <div className="rounded-2xl bg-indigo-600/15 p-2.5 text-indigo-500">
              <BookOpen size={18} />
            </div>
            <h2 className="text-xl font-semibold leading-8">{currentQuestion.question}</h2>
          </div>

          {currentQuestion.diagram ? (
            <div className={`mb-5 rounded-2xl border p-4 text-sm ${dark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
              <p className="mb-1 font-semibold">Diagram / Visual</p>
              <p className="leading-6 opacity-80">{currentQuestion.diagram}</p>
            </div>
          ) : null}

          <div className="mt-6 space-y-3">
            {currentQuestion.options.map((option) => {
              const isSelected = selectedAnswer === option;
              const isCorrect = submitted && option === currentQuestion.correctAnswer;
              const isWrong = submitted && isSelected && option !== currentQuestion.correctAnswer;

              return (
                <button
                  key={option}
                  onClick={() => {
                    if (!submitted) setSelectedAnswer(option);
                  }}
                  className={`flex w-full items-start rounded-2xl border px-4 py-3.5 text-left transition ${
                    isCorrect
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700'
                      : isWrong
                        ? 'border-rose-500 bg-rose-500/10 text-rose-700'
                        : isSelected
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-700'
                          : dark
                            ? 'border-slate-700 bg-slate-900 hover:border-slate-500'
                            : 'border-slate-200 bg-white hover:border-slate-400'
                  }`}
                >
                  <span className="mr-3 font-semibold">{String.fromCharCode(65 + currentQuestion.options.indexOf(option))}</span>
                  <span className="leading-6">{option}</span>
                </button>
              );
            })}
          </div>

          {submitted && (
            <div className={`mt-5 rounded-2xl border p-4 text-sm ${dark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
              <div className="mb-2 flex items-center gap-2 font-semibold text-emerald-500">
                <Zap size={16} />
                <span>Explanation</span>
              </div>
              <p className="leading-6 opacity-80">{currentQuestion.explanation}</p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-2 sm:gap-3">
            <button
              onClick={handleBack}
              disabled={currentIndex === 0}
              className={`flex items-center gap-2 rounded-2xl border px-5 py-2.5 font-semibold transition ${dark ? 'border-slate-700 bg-slate-800 hover:border-slate-500' : 'border-slate-300 bg-white hover:border-slate-400'} disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={selectedAnswer === null || submitted}
              className="rounded-2xl bg-indigo-600 px-5 py-2.5 font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Submit answer
            </button>
            <button
              onClick={() => setReviewMode(true)}
              className={`rounded-2xl border px-5 py-2.5 font-semibold transition ${dark ? 'border-slate-700 bg-slate-800 hover:border-slate-500' : 'border-slate-300 bg-white hover:border-slate-400'}`}
            >
              Review mode
            </button>
            <button
              onClick={handleNext}
              className={`rounded-2xl border px-5 py-2.5 font-semibold transition ${dark ? 'border-slate-700 bg-slate-800 hover:border-slate-500' : 'border-slate-300 bg-white hover:border-slate-400'}`}
            >
              {currentIndex < filteredQuestions.length - 1 ? 'Next question' : 'Finish quiz'}
            </button>
          </div>
        </div>
      </div>

      {showSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4">
          <div className={`w-full max-w-md rounded-[28px] border p-6 shadow-2xl ${dark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-2xl bg-amber-500/15 p-3 text-amber-500">
                <Trophy size={22} />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-500">Practice complete</p>
                <h2 className="text-2xl font-semibold">Nice work!</h2>
              </div>
            </div>

            <div className="mb-4 rounded-2xl bg-indigo-600/10 p-4 text-sm">
              <p className="font-semibold text-indigo-600">You scored {score} out of {filteredQuestions.length}</p>
              <p className="mt-1 leading-6 opacity-80">{getEncouragement()}</p>
            </div>

            <div className="mb-5 grid gap-3 sm:grid-cols-2">
              <div className={`rounded-2xl border p-3 ${dark ? 'border-slate-800 bg-slate-950/70' : 'border-slate-200 bg-slate-50'}`}>
                <p className="text-sm opacity-70">Accuracy</p>
                <p className="mt-1 text-xl font-semibold">{filteredQuestions.length ? Math.round(completionPercent) : 0}%</p>
              </div>
              <div className={`rounded-2xl border p-3 ${dark ? 'border-slate-800 bg-slate-950/70' : 'border-slate-200 bg-slate-50'}`}>
                <p className="text-sm opacity-70">Questions</p>
                <p className="mt-1 text-xl font-semibold">{filteredQuestions.length}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={resetQuiz}
                className="rounded-2xl bg-indigo-600 px-5 py-2.5 font-semibold text-white transition hover:bg-indigo-500"
              >
                Try again
              </button>
              <button
                onClick={() => {
                  setShowSummary(false);
                  setReviewMode(true);
                }}
                className={`rounded-2xl border px-5 py-2.5 font-semibold transition ${dark ? 'border-slate-700 bg-slate-800 hover:border-slate-500' : 'border-slate-300 bg-white hover:border-slate-400'}`}
              >
                Review answers
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CBTPracticePage;
