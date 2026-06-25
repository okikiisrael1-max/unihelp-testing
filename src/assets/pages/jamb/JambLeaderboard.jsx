import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  Crown,
  Medal,
  Search,
  Sparkles,
  Star,
  Trophy,
  TrendingUp,
  User2,
  BrainCircuit,
  ChevronUp,
} from "lucide-react";

import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";

import { useNavigate } from "react-router-dom";

import { db } from "../../../firebase/config";

const JambLeaderboard = ({
  dark = true,
}) => {
  const navigate =
    useNavigate();

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [students, setStudents] =
    useState([]);

  /* ================= THEME ================= */

  const bg = dark
    ? "bg-[#020617] text-white"
    : "bg-[#f8fafc] text-slate-900";

  const card = dark
    ? "bg-white/5 border border-white/10 backdrop-blur-xl"
    : "bg-white border border-slate-200 shadow-sm";

  const fade = dark
    ? "text-slate-400"
    : "text-slate-500";

  const input = dark
    ? "bg-white/5 border-white/10 text-white placeholder:text-slate-500"
    : "bg-slate-100 border-slate-200 text-slate-900 placeholder:text-slate-400";

  /* ================= FETCH ================= */

  useEffect(() => {
    const q = query(
      collection(
        db,
        "jambLeaderboard"
      ),
      orderBy("score", "desc")
    );

    const unsubscribe =
      onSnapshot(q, (snapshot) => {
        const arr = [];

        snapshot.forEach((doc) => {
          arr.push({
            id: doc.id,
            ...doc.data(),
          });
        });

        setStudents(arr);

        setLoading(false);
      });

    return () =>
      unsubscribe();
  }, []);

  /* ================= FILTER ================= */

  const filteredStudents =
    useMemo(() => {
      return students.filter(
        (student) =>
          student?.name
            ?.toLowerCase()
            .includes(
              search.toLowerCase()
            )
      );
    }, [students, search]);

  /* ================= TOP 3 ================= */

  const topThree =
    filteredStudents.slice(0, 3);

  /* ================= BADGES ================= */

  const getRankIcon = (
    index
  ) => {
    if (index === 0)
      return (
        <Crown className="text-yellow-400" />
      );

    if (index === 1)
      return (
        <Medal className="text-slate-300" />
      );

    if (index === 2)
      return (
        <Medal className="text-orange-400" />
      );

    return (
      <Trophy className="text-indigo-400" />
    );
  };

  const getRankBg = (
    index
  ) => {
    if (index === 0)
      return "from-yellow-400 to-orange-500";

    if (index === 1)
      return "from-slate-300 to-slate-500";

    if (index === 2)
      return "from-orange-400 to-red-500";

    return "from-indigo-500 to-purple-600";
  };

  return (
    <div
      className={`min-h-screen relative overflow-hidden ${bg}`}
    >
      {/* BG */}

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-[420px] h-[420px] bg-indigo-500/10 blur-3xl rounded-full" />

        <div className="absolute bottom-0 right-0 w-[420px] h-[420px] bg-purple-500/10 blur-3xl rounded-full" />
      </div>

      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        {/* TOP */}

        <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between mb-8">
          {/* LEFT */}

          <div className="flex items-center gap-4">
            <button
              onClick={() =>
                navigate(-1)
              }
              className={`w-13 h-13 rounded-2xl flex items-center justify-center transition-all ${
                dark
                  ? "bg-white/5 hover:bg-white/10 border border-white/10"
                  : "bg-white border border-slate-200 hover:bg-slate-100"
              }`}
            >
              <ArrowLeft
                size={22}
              />
            </button>

            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 text-yellow-400 text-sm font-semibold mb-3">
                <Sparkles size={15} />
                Top JAMB Students
              </div>

              <h1 className="text-4xl sm:text-5xl font-black">
                Leaderboard
              </h1>

              <p
                className={`mt-2 ${fade}`}
              >
                Track top-performing
                students and compete
                globally.
              </p>
            </div>
          </div>

          {/* SEARCH */}

          <div
            className={`h-14 px-4 rounded-2xl flex items-center gap-3 w-full lg:w-[350px] ${card}`}
          >
            <Search
              size={20}
              className={
                fade
              }
            />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search student..."
              className={`flex-1 bg-transparent outline-none ${fade}`}
            />
          </div>
        </div>

        {/* TOP CARDS */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {topThree.map(
            (
              student,
              index
            ) => (
              <div
                key={student.id}
                className={`${card} rounded-[32px] p-6 relative overflow-hidden`}
              >
                <div
                  className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-br ${getRankBg(
                    index
                  )} opacity-10 blur-3xl rounded-full`}
                />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <div
                      className={`w-16 h-16 rounded-3xl bg-gradient-to-r ${getRankBg(
                        index
                      )} flex items-center justify-center text-white`}
                    >
                      {getRankIcon(
                        index
                      )}
                    </div>

                    <div className="text-right">
                      <p
                        className={`text-sm ${fade}`}
                      >
                        Rank
                      </p>

                      <h3 className="text-3xl font-black">
                        #
                        {index +
                          1}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div
                      className={`w-16 h-16 rounded-full bg-gradient-to-r ${getRankBg(
                        index
                      )} flex items-center justify-center text-white text-2xl font-black`}
                    >
                      {student?.photo ? (
                        <img
                          src={
                            student.photo
                          }
                          alt="profile"
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        student?.name
                          ?.charAt(
                            0
                          )
                          ?.toUpperCase()
                      )}
                    </div>

                    <div>
                      <h2 className="text-2xl font-black">
                        {
                          student.name
                        }
                      </h2>

                      <p
                        className={
                          fade
                        }
                      >
                        {
                          student.school
                        }
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 grid grid-cols-2 gap-4">
                    <div
                      className={`rounded-2xl p-4 ${
                        dark
                          ? "bg-white/5"
                          : "bg-slate-100"
                      }`}
                    >
                      <p
                        className={`text-sm ${fade}`}
                      >
                        Score
                      </p>

                      <h3 className="text-2xl font-black mt-1">
                        {
                          student.score
                        }
                      </h3>
                    </div>

                    <div
                      className={`rounded-2xl p-4 ${
                        dark
                          ? "bg-white/5"
                          : "bg-slate-100"
                      }`}
                    >
                      <p
                        className={`text-sm ${fade}`}
                      >
                        Streak
                      </p>

                      <h3 className="text-2xl font-black mt-1">
                        {
                          student.streak
                        }
                        🔥
                      </h3>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
        </div>

        {/* MAIN */}

        <div
          className={`${card} rounded-[35px] overflow-hidden`}
        >
          {/* HEADER */}

          <div
            className={`p-6 border-b ${
              dark
                ? "border-white/10"
                : "border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-3xl font-black">
                  Global Rankings
                </h2>

                <p
                  className={`mt-2 ${fade}`}
                >
                  Updated in real-time
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-4 py-2 rounded-full bg-green-500/10 text-green-400 text-sm font-semibold flex items-center gap-2">
                  <TrendingUp
                    size={16}
                  />
                  Live Ranking
                </div>

                <div className="px-4 py-2 rounded-full bg-indigo-500/10 text-indigo-400 text-sm font-semibold flex items-center gap-2">
                  <BrainCircuit
                    size={16}
                  />
                  AI Powered
                </div>
              </div>
            </div>
          </div>

          {/* TABLE */}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px]">
              <thead>
                <tr
                  className={`border-b ${
                    dark
                      ? "border-white/10"
                      : "border-slate-200"
                  }`}
                >
                  {[
                    "Rank",
                    "Student",
                    "School",
                    "Score",
                    "Accuracy",
                    "Streak",
                    "Performance",
                  ].map(
                    (
                      item,
                      index
                    ) => (
                      <th
                        key={index}
                        className={`text-left p-6 font-semibold ${fade}`}
                      >
                        {item}
                      </th>
                    )
                  )}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="p-10 text-center"
                    >
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />

                        Loading
                        leaderboard...
                      </div>
                    </td>
                  </tr>
                ) : filteredStudents
                    .length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="p-10 text-center"
                    >
                      No students
                      found.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map(
                    (
                      student,
                      index
                    ) => (
                      <tr
                        key={
                          student.id
                        }
                        className={`border-b transition-all ${
                          dark
                            ? "border-white/5 hover:bg-white/5"
                            : "border-slate-100 hover:bg-slate-50"
                        }`}
                      >
                        {/* RANK */}

                        <td className="p-6">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-12 h-12 rounded-2xl bg-gradient-to-r ${getRankBg(
                                index
                              )} flex items-center justify-center text-white`}
                            >
                              {getRankIcon(
                                index
                              )}
                            </div>

                            <span className="text-xl font-black">
                              #
                              {index +
                                1}
                            </span>
                          </div>
                        </td>

                        {/* STUDENT */}

                        <td className="p-6">
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-14 h-14 rounded-full bg-gradient-to-r ${getRankBg(
                                index
                              )} flex items-center justify-center text-white font-black text-lg overflow-hidden`}
                            >
                              {student?.photo ? (
                                <img
                                  src={
                                    student.photo
                                  }
                                  alt="profile"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                student?.name
                                  ?.charAt(
                                    0
                                  )
                                  ?.toUpperCase()
                              )}
                            </div>

                            <div>
                              <h3 className="font-bold text-lg">
                                {
                                  student.name
                                }
                              </h3>

                              <div
                                className={`flex items-center gap-2 text-sm ${fade}`}
                              >
                                <User2 size={14} />
                                Student
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* SCHOOL */}

                        <td className="p-6 font-medium">
                          {
                            student.school
                          }
                        </td>

                        {/* SCORE */}

                        <td className="p-6">
                          <div className="flex items-center gap-2">
                            <Star className="text-yellow-400" />

                            <span className="text-2xl font-black">
                              {
                                student.score
                              }
                            </span>
                          </div>
                        </td>

                        {/* ACCURACY */}

                        <td className="p-6">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-3 rounded-full bg-slate-300/20 overflow-hidden">
                              <div
                                style={{
                                  width: `${
                                    student.accuracy ||
                                    0
                                  }%`,
                                }}
                                className="h-full bg-green-500 rounded-full"
                              />
                            </div>

                            <span className="font-semibold">
                              {
                                student.accuracy
                              }
                              %
                            </span>
                          </div>
                        </td>

                        {/* STREAK */}

                        <td className="p-6">
                          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 text-orange-400 text-sm font-semibold">
                            🔥
                            {
                              student.streak
                            }
                          </div>
                        </td>

                        {/* PERFORMANCE */}

                        <td className="p-6">
                          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-400 text-sm font-semibold">
                            <ChevronUp
                              size={16}
                            />
                            Excellent
                          </div>
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JambLeaderboard;