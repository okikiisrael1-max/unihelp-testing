import {
  Calculator,
  X,
  LucideLightbulb,
  SaveIcon,
  Trash2Icon,
  LucideCalculator,
  Plus,
  BookOpen,
  Trophy,
  BarChart3,
  GraduationCap,
  Sparkles,
  AlertCircle,
} from "lucide-react";

import {
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

import { useEffect, useState } from "react";
import { auth, db } from "../../firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import gpaIcon from "../images/gpa-icon.jpg";

const GPA = ({ dark }) => {
  const navigate = useNavigate();

  const emptyCourse = {
    title: "",
    code: "",
    unit: "",
    grade: "A",
  };

  const [courses, setCourses] = useState([emptyCourse]);

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showPopup, setShowPopup] = useState(false);
  const [rating, setRating] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const gradeMap = {
    A: 5,
    B: 4,
    C: 3,
    D: 2,
    E: 1,
    F: 0,
  };

  /* ---------------------------------- */
  /* ADD COURSE */
  /* ---------------------------------- */

  const addCourse = () => {
    setCourses([...courses, emptyCourse]);
  };

  /* ---------------------------------- */
  /* REMOVE COURSE */
  /* ---------------------------------- */

  const removeCourse = (index) => {
    const updated = courses.filter((_, i) => i !== index);

    setCourses(updated.length ? updated : [emptyCourse]);
  };

  /* ---------------------------------- */
  /* UPDATE COURSE */
  /* ---------------------------------- */

  const updateCourse = (index, field, value) => {
    const updated = [...courses];

    if (field === "unit") {
      updated[index][field] =
        Number(value) > 0 ? Number(value) : "";
    } else {
      updated[index][field] = value;
    }

    setCourses(updated);
  };

  /* ---------------------------------- */
  /* GPA */
  /* ---------------------------------- */

  const calculateGPA = () => {
    let totalPoints = 0;
    let totalUnits = 0;

    courses.forEach((course) => {
      if (course.unit > 0) {
        totalPoints +=
          course.unit * gradeMap[course.grade];

        totalUnits += Number(course.unit);
      }
    });

    return totalUnits
      ? (totalPoints / totalUnits).toFixed(2)
      : "0.00";
  };

  const gpaValue = calculateGPA();

  /* ---------------------------------- */
  /* RESULT */
  /* ---------------------------------- */

  const handleResult = () => {
    const value = Number(gpaValue);

    if (value >= 4.5) {
      setRating("🏆 First Class");
    } else if (value >= 3.5) {
      setRating("💪 Second Class Upper");
    } else if (value >= 2.5) {
      setRating("👍 Second Class Lower");
    } else if (value >= 1.5) {
      setRating("🙂 Third Class");
    } else {
      setRating("⚠️ Probation");
    }

    setShowPopup(true);
  };

  /* ---------------------------------- */
  /* SUMMARY */
  /* ---------------------------------- */

  const calculateSummary = () => {
    let totalCourses = 0;
    let totalUnits = 0;
    let totalPoints = 0;

    courses.forEach((course) => {
      if (course.unit > 0) {
        totalCourses += 1;
        totalUnits += Number(course.unit);

        totalPoints +=
          course.unit * gradeMap[course.grade];
      }
    });

    return {
      totalCourses,
      totalUnits,
      totalPoints,
    };
  };

  const summary = calculateSummary();

  /* ---------------------------------- */
  /* SAVE */
  /* ---------------------------------- */

  const handleSave = async () => {
    if (!auth.currentUser) {
      setMsg("Login required");
      return;
    }

    setIsSaving(true);
    setMsg("");

    try {
      await addDoc(collection(db, "GPARecords"), {
        userId: auth.currentUser.uid,
        GPA: gpaValue,
        courses,
        createdAt: serverTimestamp(),
      });

      setMsg("Saved successfully 🔥");

      await fetchResults(auth.currentUser);
    } catch (err) {
      setMsg("Failed to save");
    }

    setIsSaving(false);
  };

  /* ---------------------------------- */
  /* FETCH */
  /* ---------------------------------- */

  const fetchResults = async (currentUser) => {
    if (!currentUser) return;

    try {
      const q = query(
        collection(db, "GPARecords"),
        where("userId", "==", currentUser.uid)
      );

      const snapshot = await getDocs(q);

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setRecords(data);
    } catch (err) {
      console.log(err);
    }

    setLoading(false);
  };

  /* ---------------------------------- */
  /* AUTH */
  /* ---------------------------------- */

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        if (user) {
          fetchResults(user);
        } else {
          setLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, []);

  /* ---------------------------------- */
  /* DELETE */
  /* ---------------------------------- */

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "GPARecords", id));

      setRecords(
        records.filter((item) => item.id !== id)
      );
    } catch (err) {
      console.log(err);
    }
  };

  /* ---------------------------------- */
  /* CLEAR */
  /* ---------------------------------- */

  const handleClearAll = () => {
    setCourses([emptyCourse]);

    setShowPopup(false);
    setMsg("");
    setRating("");
  };

  /* ---------------------------------- */
  /* STYLES */
  /* ---------------------------------- */

  const bg = dark
    ? "bg-[#0b1120] text-white"
    : "bg-[#f4f7ff] text-gray-900";

  const card = dark
    ? "bg-[#111827] border border-white/10"
    : "bg-white border border-gray-200 shadow-sm";

  const inputClass = `w-full p-3.5 rounded-xl border outline-none transition-all text-sm md:text-base font-medium ${
    dark
      ? "bg-[#1f2937]/50 border-white/10 focus:border-indigo-500 focus:bg-[#1f2937]"
      : "bg-gray-50 border-gray-200 focus:border-indigo-500 focus:bg-white focus:shadow-md focus:shadow-indigo-500/10"
  }`;

  return (
    <div className={`min-h-screen md:pt-20 ${bg}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* MOBILE CGPA BUTTON */}
        <button
          onClick={() => navigate("/cgpa")}
          className="md:hidden mb-6 flex items-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 text-white font-semibold"
        >
          <LucideCalculator size={18} />
          CGPA Tracker
        </button>

        {/* HEADER */}
        <div className="relative mb-8 overflow-hidden rounded-[24px] p-6 md:p-8 bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-900 text-white shadow-2xl flex flex-col md:flex-row items-center gap-6">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500 rounded-full blur-[80px] opacity-40 -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500 rounded-full blur-[80px] opacity-40 translate-y-1/2 -translate-x-1/3"></div>

          <div className="relative z-10 w-24 h-24 md:w-32 md:h-32 shrink-0 rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/20 border border-white/20">
             <img src={gpaIcon} alt="GPA Calculator" className="w-full h-full object-cover scale-110" />
          </div>

          <div className="relative z-10 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-3">
              <Sparkles size={12} className="text-purple-300" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-100">Live Tracker</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight mb-2">
              GPA Calculator
            </h1>
            <p className="opacity-80 text-sm font-medium max-w-sm mx-auto md:mx-0 leading-snug">
              Calculate, analyze and save your semester performance with real-time insights.
            </p>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="grid xl:grid-cols-3 gap-6">

          {/* LEFT */}
          <div className="xl:col-span-2">

            <div className={`${card} rounded-3xl p-4 md:p-6`}>

              {/* TOP */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">

                <div>
                  <h2 className="font-bold text-xl flex items-center gap-2">
                    <BookOpen size={20} />
                    Course List
                  </h2>

                  <p className="text-sm opacity-60">
                    Add your semester courses
                  </p>
                </div>

                <button
                  onClick={addCourse}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition"
                >
                  <Plus size={18} />
                  Add Course
                </button>
              </div>

              {/* COURSES */}
              <div className="space-y-4">

                {courses.map((course, index) => (
                  <div
                    key={index}
                    className={`rounded-2xl p-4 border ${
                      dark
                        ? "border-white/10 bg-black/20"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">

                      {/* TITLE */}
                      <div className="md:col-span-4">
                        <label className="text-xs opacity-60 mb-1 block">
                          Course Title
                        </label>

                        <input
                          type="text"
                          placeholder="Mathematics"
                          value={course.title}
                          onChange={(e) =>
                            updateCourse(
                              index,
                              "title",
                              e.target.value
                            )
                          }
                          className={inputClass}
                        />
                      </div>

                      {/* CODE */}
                      <div className="md:col-span-3">
                        <label className="text-xs opacity-60 mb-1 block">
                          Course Code
                        </label>

                        <input
                          type="text"
                          placeholder="MTH101"
                          value={course.code}
                          onChange={(e) =>
                            updateCourse(
                              index,
                              "code",
                              e.target.value
                            )
                          }
                          className={inputClass}
                        />
                      </div>

                      {/* UNIT */}
                      <div className="md:col-span-2">
                        <label className="text-xs opacity-60 mb-1 block">
                          Unit
                        </label>

                        <input
                          type="number"
                          placeholder="3"
                          value={course.unit}
                          onChange={(e) =>
                            updateCourse(
                              index,
                              "unit",
                              e.target.value
                            )
                          }
                          className={inputClass}
                        />
                      </div>

                      {/* GRADE */}
                      <div className="md:col-span-3">
                        <label className="text-xs opacity-60 mb-1 block">
                          Grade
                        </label>

                        <div className="flex gap-2">

                          <select
                            value={course.grade}
                            onChange={(e) =>
                              updateCourse(
                                index,
                                "grade",
                                e.target.value
                              )
                            }
                            className={inputClass}
                          >
                            <option>A</option>
                            <option>B</option>
                            <option>C</option>
                            <option>D</option>
                            <option>E</option>
                            <option>F</option>
                          </select>

                          <button
                            onClick={() =>
                              removeCourse(index)
                            }
                            className="w-12 md:w-14 shrink-0 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white hover:shadow-lg hover:shadow-red-500/20 transition-all active:scale-90"
                          >
                            <Trash2Icon size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ACTIONS */}
              <div className="flex flex-col sm:flex-row gap-3 mt-8">

                <button
                  onClick={handleResult}
                  className="flex-1 px-6 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center justify-center gap-2 transition-all hover:shadow-xl hover:shadow-indigo-500/20 active:scale-[0.98]"
                >
                  <Calculator size={20} />
                  Calculate GPA
                </button>

                <button
                  onClick={handleClearAll}
                  className="px-6 py-4 rounded-2xl bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/20 hover:border-red-500 text-red-500 font-bold transition-all active:scale-[0.98]"
                >
                  Clear All
                </button>
              </div>

              {/* FORMULA */}
              <div
                className={`mt-8 rounded-2xl p-5 flex gap-3 ${
                  dark
                    ? "bg-yellow-500/10 border border-yellow-500/20"
                    : "bg-yellow-50 border border-yellow-200"
                }`}
              >
                <LucideLightbulb className="text-yellow-500 shrink-0" />

                <div>
                  <h3 className="font-bold mb-1">
                    GPA Formula
                  </h3>

                  <p className="text-sm opacity-70">
                    GPA = Total Grade Points ÷ Total
                    Units
                  </p>

                  <p className="text-sm opacity-70 mt-1">
                    A=5, B=4, C=3, D=2, E=1, F=0
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-5">

            {/* SUMMARY */}
            <div className={`${card} rounded-3xl p-6 relative overflow-hidden`}>
              <div className="absolute top-0 right-0 p-32 bg-indigo-500/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
              
              <h2 className="font-bold text-xl flex items-center gap-2 mb-6 relative z-10">
                <BarChart3 size={20} className="text-indigo-500" />
                Live Summary
              </h2>

              <div className="flex items-center justify-center mb-8 relative z-10">
                <div className="relative w-40 h-40 group">
                  <div className="absolute inset-0 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition-colors"></div>
                  <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90 drop-shadow-md">
                    <path
                      className={dark ? "text-white/10" : "text-gray-200"}
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      strokeLinecap="round"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-indigo-500 transition-all duration-1000 ease-out"
                      strokeDasharray={`${(gpaValue / 5) * 100}, 100`}
                      strokeLinecap="round"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-indigo-500">{gpaValue}</span>
                    <span className="text-xs font-bold opacity-50 uppercase tracking-[0.2em] mt-1">GPA</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 relative z-10 bg-black/5 dark:bg-white/5 rounded-2xl p-4 border border-black/5 dark:border-white/5">

                <div className="flex justify-between items-center px-2">
                  <p className="opacity-70 text-sm font-medium">
                    Total Courses
                  </p>
                  <h3 className="font-bold text-lg text-indigo-500">
                    {summary.totalCourses}
                  </h3>
                </div>
                
                <div className="h-px w-full bg-black/5 dark:bg-white/5"></div>

                <div className="flex justify-between items-center px-2">
                  <p className="opacity-70 text-sm font-medium">
                    Total Units
                  </p>
                  <h3 className="font-bold text-lg text-indigo-500">
                    {summary.totalUnits}
                  </h3>
                </div>

                <div className="h-px w-full bg-black/5 dark:bg-white/5"></div>

                <div className="flex justify-between items-center px-2">
                  <p className="opacity-70 text-sm font-medium">
                    Grade Points
                  </p>
                  <h3 className="font-bold text-lg text-indigo-500">
                    {summary.totalPoints}
                  </h3>
                </div>
              </div>
            </div>


          </div>
        </div>

        {/* SAVED RESULTS */}
        <div className="mt-12">

          <div className="flex items-center gap-3 mb-6">
            <GraduationCap className="text-indigo-500" />

            <div>
              <h2 className="text-3xl font-black">
                Saved Results
              </h2>

              <p className="opacity-60 text-sm">
                Your previous GPA records
              </p>
            </div>
          </div>

          {loading && (
            <p className="opacity-70">Loading...</p>
          )}

          {!loading && records.length === 0 && (
            <div
              className={`${card} rounded-3xl p-10 text-center`}
            >
              <AlertCircle
                size={50}
                className="mx-auto mb-4 opacity-40"
              />

              <p className="opacity-70">
                No saved GPA records yet
              </p>
            </div>
          )}

          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">

            {records.map((item) => (
              <div
                key={item.id}
                className={`${card} rounded-3xl p-5`}
              >

                <div className="flex justify-between items-start mb-4">

                  <div>
                    <p className="text-sm opacity-60">
                      GPA
                    </p>

                    <h2 className="text-4xl font-black text-indigo-500">
                      {item.GPA}
                    </h2>
                  </div>

                  <button
                    onClick={() =>
                      handleDelete(item.id)
                    }
                    className="text-red-500 hover:scale-110 transition"
                  >
                    <Trash2Icon size={20} />
                  </button>
                </div>

                <p className="text-xs opacity-50 mb-4">
                  {item.createdAt
                    ?.toDate()
                    .toLocaleDateString()}
                </p>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">

                  {item.courses.map((c, i) => (
                    <div
                      key={i}
                      className={`rounded-2xl p-3 ${
                        dark
                          ? "bg-black/20"
                          : "bg-gray-50"
                      }`}
                    >
                      <div className="flex justify-between">
                        <p className="font-semibold">
                          {c.code}
                        </p>

                        <span className="font-bold text-indigo-500">
                          {c.grade}
                        </span>
                      </div>

                      <p className="text-sm opacity-70">
                        {c.title}
                      </p>

                      <p className="text-xs opacity-50 mt-1">
                        {c.unit} Units
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RESULT POPUP */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">

          <div
            className={`w-full max-w-md rounded-[2rem] p-6 md:p-8 relative animate-[fadeIn_.3s_ease] ${
              dark
                ? "bg-[#111827] border border-white/10"
                : "bg-white"
            } shadow-2xl`}
          >

            {/* CLOSE */}
            <button
              onClick={() => setShowPopup(false)}
              className="absolute top-5 right-5 w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center"
            >
              <X size={18} />
            </button>

            <div className="text-center">

              {/* GPA CIRCLE */}
              <div className="w-40 h-40 mx-auto rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl">

                <div className="w-32 h-32 rounded-full bg-white text-indigo-600 flex items-center justify-center text-5xl font-black">
                  {gpaValue}
                </div>
              </div>

              <h2 className="text-3xl font-black mt-6">
                Your GPA
              </h2>

              <p className="opacity-70 mt-2">
                Academic performance result
              </p>

              {/* RATING */}
              <div className="mt-5 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-green-500/10 text-green-500 font-semibold">
                <Trophy size={18} />
                {rating}
              </div>

              {/* SAVE */}
              <button
                onClick={handleSave}
                className="w-full mt-6 py-4 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center justify-center gap-2 transition"
              >
                <SaveIcon size={18} />

                {isSaving
                  ? "Saving..."
                  : "Save Result"}
              </button>

              {/* MESSAGE */}
              {msg && (
                <p className="text-sm mt-4 opacity-70">
                  {msg}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GPA;