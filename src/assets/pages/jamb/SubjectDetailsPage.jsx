// =======================================================
// FILE: src/pages/subjects/SubjectDetailPage.jsx
// PREMIUM RESPONSIVE SUBJECT DETAIL PAGE
// AUTO LOADS TOPICS FROM questionBank.js
// MODERN UI + CLEAN UX + FULLY RESPONSIVE
// =======================================================

import React, { useMemo, useState } from "react";

import {
  ArrowLeft,
  Brain,
  ChevronRight,
  Clock3,
  FileQuestion,
  Search,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import { questionBank } from "../../data/questionBank";

const SubjectDetailPage = ({ dark = true }) => {
  const navigate = useNavigate();

  const { subjectId } = useParams();

  const [search, setSearch] = useState("");

  /* ======================================================
   SUBJECT
  ====================================================== */

  const normalizedSubject =
    subjectId?.toLowerCase();

  const questions =
    questionBank?.[
      normalizedSubject
    ] || [];

  /* ======================================================
   TOPICS FROM QUESTION BANK
  ====================================================== */

  const generatedTopics =
    useMemo(() => {
      const topicMap = {};

      questions.forEach(
        (question) => {
          const topic =
            question.topic ||
            "General";

          if (!topicMap[topic]) {
            topicMap[topic] = {
              title: topic,
              questions: 0,
            };
          }

          topicMap[
            topic
          ].questions += 1;
        },
      );

      return Object.values(
        topicMap,
      );
    }, [questions]);

  /* ======================================================
   FILTER TOPICS
  ====================================================== */

  const filteredTopics =
    useMemo(() => {
      return generatedTopics.filter(
        (topic) =>
          topic.title
            .toLowerCase()
            .includes(
              search.toLowerCase(),
            ),
      );
    }, [
      generatedTopics,
      search,
    ]);

  /* ======================================================
   THEME
  ====================================================== */

  const bg = dark
    ? "bg-[#020617] text-white"
    : "bg-slate-100 text-slate-900";

  const card = dark
    ? "bg-white/[0.04] border border-white/10 backdrop-blur-2xl"
    : "bg-white border border-slate-200";

  const fade = dark
    ? "text-slate-400"
    : "text-slate-500";

  /* ======================================================
   STATS
  ====================================================== */

  const totalQuestions =
    questions.length;

  const totalTopics =
    generatedTopics.length;

  /* ======================================================
   UI
  ====================================================== */

  return (
    <div
      className={`min-h-screen overflow-hidden relative ${bg}`}
    >
      {/* BACKGROUND */}

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-200px] left-[-200px] w-[500px] h-[500px] bg-indigo-500/10 blur-[140px] rounded-full" />

        <div className="absolute bottom-[-200px] right-[-200px] w-[500px] h-[500px] bg-cyan-500/10 blur-[140px] rounded-full" />
      </div>

      {/* CONTAINER */}

      <div className="relative z-10 max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* ======================================================
         HEADER
        ====================================================== */}

        <div className="flex items-start justify-between gap-4 mb-10">
          {/* BACK */}

          <button
            onClick={() =>
              navigate(-1)
            }
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all hover:scale-105 ${card}`}
          >
            <ArrowLeft />
          </button>

          {/* TITLE */}

          <div className="flex-1 text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-semibold mb-5">
              <Sparkles size={16} />
              Premium Learning Hub
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight">
              {normalizedSubject}
            </h1>

            <p
              className={`mt-4 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto ${fade}`}
            >
              Practice CBT questions,
              improve speed, and
              master all important
              topics for your exam.
            </p>
          </div>

          <div className="w-12 sm:w-14" />
        </div>

        {/* ======================================================
         HERO STATS
        ====================================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-10">
          {/* QUESTIONS */}

          <div
            className={`${card} rounded-[32px] p-6`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-sm ${fade}`}
                >
                  Total Questions
                </p>

                <h2 className="text-4xl font-black mt-2">
                  {
                    totalQuestions
                  }
                </h2>
              </div>

              <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <FileQuestion size={30} />
              </div>
            </div>
          </div>

          {/* TOPICS */}

          <div
            className={`${card} rounded-[32px] p-6`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-sm ${fade}`}
                >
                  Available Topics
                </p>

                <h2 className="text-4xl font-black mt-2">
                  {totalTopics}
                </h2>
              </div>

              <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <Brain size={30} />
              </div>
            </div>
          </div>

          {/* CBT */}

          <div
            className={`${card} rounded-[32px] p-6 sm:col-span-2 xl:col-span-1`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-sm ${fade}`}
                >
                  CBT Practice
                </p>

                <h2 className="text-4xl font-black mt-2">
                  Ready
                </h2>
              </div>

              <div className="w-16 h-16 rounded-3xl bg-green-500/10 text-green-400 flex items-center justify-center">
                <Trophy size={30} />
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================
         SEARCH
        ====================================================== */}

        <div
          className={`${card} h-16 rounded-2xl px-5 flex items-center gap-4 mb-10`}
        >
          <Search
            size={20}
            className={fade}
          />

          <input
            type="text"
            placeholder="Search topic..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value,
              )
            }
            className={`bg-transparent outline-none w-full text-base ${fade}`}
          />
        </div>

        {/* ======================================================
         TOPICS GRID
        ====================================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-6">
          {filteredTopics.map(
            (topic, index) => (
              <div
                key={index}
                className={`${card} rounded-[32px] p-6 transition-all duration-300 hover:translate-y-[-5px] hover:border-indigo-500/30 group`}
              >
                {/* TOP */}

                <div className="flex items-start justify-between gap-4 mb-6">
                  <div className="flex-1">
                    <div className="w-16 h-16 rounded-3xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white flex items-center justify-center mb-5 shadow-lg">
                      <Target size={28} />
                    </div>

                    <h2 className="text-2xl font-black leading-tight">
                      {topic.title}
                    </h2>

                    <p
                      className={`mt-3 text-sm ${fade}`}
                    >
                      Master all CBT
                      questions under
                      this topic.
                    </p>
                  </div>

                  <ChevronRight className="opacity-40 group-hover:translate-x-1 transition-all" />
                </div>

                {/* STATS */}

                <div className="flex items-center justify-between mb-6">
                  <div
                    className={`flex items-center gap-2 text-sm ${fade}`}
                  >
                    <Clock3 size={16} />

                    Practice Ready
                  </div>

                  <div className="px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-bold">
                    {
                      topic.questions
                    }{" "}
                    Questions
                  </div>
                </div>

                {/* BUTTON */}

                <button
                  onClick={() =>
                    navigate(
                      `/subjects/${normalizedSubject}/cbt`,
                    )
                  }
                  className="w-full h-14 rounded-2xl bg-indigo-500 hover:bg-indigo-600 active:scale-[0.98] transition-all font-bold text-white"
                >
                  Start CBT Practice
                </button>
              </div>
            ),
          )}
        </div>

        {/* ======================================================
         EMPTY
        ====================================================== */}

        {filteredTopics.length ===
          0 && (
          <div
            className={`${card} rounded-[40px] p-12 text-center mt-10`}
          >
            <Search
              size={60}
              className="mx-auto mb-5 text-indigo-500"
            />

            <h2 className="text-3xl font-black">
              No Topic Found
            </h2>

            <p
              className={`mt-3 ${fade}`}
            >
              Try another search
              keyword.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubjectDetailPage;