import React, { useContext, useState } from "react";

import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Sparkles,
  Target,
  ShieldCheck,
  BrainCircuit,
  Users,
} from "lucide-react";

import { AuthContext } from "../context/AuthContext";

import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import { db } from "../../firebase/config";

import { useNavigate } from "react-router-dom";

const SelectRole = ({ dark }) => {
  const { user } = useContext(AuthContext);

  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [selected, setSelected] = useState("");

  /* ================= SAVE ROLE ================= */

  const handleContinue = async () => {
    if (!selected || !user) return;

    try {
      setLoading(true);

      const userRef = doc(db, "users", user.uid);

      const snap = await getDoc(userRef);

      /* CREATE USER DOC IF NOT EXISTS */

      if (!snap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          username: user.displayName || "",
          photo: user.photoURL || "",
          createdAt: serverTimestamp(),
        });
      }

      /* SAVE ROLE */

      await setDoc(
        userRef,
        {
          role: selected,
          roleSelectedAt: serverTimestamp(),
        },
        { merge: true },
      );

      /* REDIRECT */

      if (selected === "jamb") {
        navigate("/");
      }

      if (selected === "university") {
        navigate("/");
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= STYLES ================= */

  const bg = dark ? "bg-[#020617] text-white" : "bg-[#f8fafc] text-black";

  const glass = dark
    ? "bg-white/5 border border-white/10 backdrop-blur-2xl"
    : "bg-white border border-gray-200";

  const card = dark
    ? "bg-white/5 border border-white/10 hover:border-indigo-500/40"
    : "bg-white border border-gray-200 hover:border-indigo-300";

  const selectedCard = dark
    ? "border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10"
    : "border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-100";

  return (
    <div className={`min-h-screen relative overflow-hidden ${bg}`}>
      {/* BACKGROUND BLURS */}

      <div className="absolute top-0 left-0 w-72 h-72 bg-indigo-500/20 blur-3xl rounded-full" />

      <div className="absolute bottom-0 right-0 w-72 h-72 bg-purple-500/20 blur-3xl rounded-full" />

      <div className="relative z-10 min-h-screen flex flex-col lg:flex-row">
        {/* ================= LEFT SIDE ================= */}

        <div className="hidden lg:flex lg:w-1/2 p-10 xl:p-14 flex-col justify-between">
          {/* TOP */}

          <div>
            {/* LOGO */}

            <div className="flex items-center gap-3 mb-12">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <GraduationCap size={28} className="text-white" />
              </div>

              <div>
                <h1 className="font-black text-2xl">UniHelp.ng</h1>

                <p className="text-sm opacity-70">Smart student platform</p>
              </div>
            </div>

            {/* HERO */}

            <div className="max-w-xl">
              <h1 className="text-5xl font-black leading-tight">
                Personalized
                <br />
                Learning
                <br />
                <span className="text-indigo-500">Starts Here.</span>
              </h1>

              <p className="mt-6 text-lg opacity-70 leading-relaxed">
                Select your academic path so UniHelp can tailor tools, resources
                and recommendations specifically for you.
              </p>
            </div>

            {/* FEATURES */}

            <div className="mt-14 grid gap-5">
              {[
                {
                  icon: <BrainCircuit size={22} />,
                  title: "AI-Powered Learning",
                  desc: "Get personalized academic support and tools.",
                  color: "from-indigo-500 to-purple-600",
                },

                {
                  icon: <ShieldCheck size={22} />,
                  title: "Secure Student Platform",
                  desc: "Protected and trusted learning environment.",
                  color: "from-green-500 to-emerald-600",
                },

                {
                  icon: <Users size={22} />,
                  title: "Student Community",
                  desc: "Connect with students across Nigeria.",
                  color: "from-pink-500 to-rose-500",
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className={`${glass} rounded-3xl p-5 flex gap-4 hover:scale-[1.02] transition-all duration-300`}
                >
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shrink-0`}
                  >
                    {item.icon}
                  </div>

                  <div>
                    <h3 className="font-bold text-lg">{item.title}</h3>

                    <p className="opacity-70 text-sm mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FOOTER */}

          <div className="flex items-center justify-between mt-10">
            <p className="text-sm opacity-50">© 2026 UniHelp.ng</p>

            <div className="flex items-center gap-2 text-sm opacity-60">
              <Sparkles size={16} />

              <span>Built for Nigerian students</span>
            </div>
          </div>
        </div>

        {/* ================= RIGHT SIDE ================= */}

        <div className="w-full lg:w-1/2 flex items-center justify-center px-5 py-10">
          <div
            className={`w-full max-w-2xl rounded-[32px] p-6 md:p-8 lg:p-10 ${glass} shadow-2xl`}
          >
            {/* MOBILE LOGO */}

            <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500 flex items-center justify-center">
                <GraduationCap className="text-white" />
              </div>

              <div>
                <h1 className="font-black text-2xl">UniHelp.ng</h1>

                <p className="text-sm opacity-70">Smart student platform</p>
              </div>
            </div>

            {/* HEADER */}

            <div className="text-center mb-10">
              <div className="mx-auto w-20 h-20 rounded-3xl bg-indigo-500/10 flex items-center justify-center mb-5">
                <Sparkles className="text-indigo-500" size={38} />
              </div>

              <h1 className="text-3xl md:text-4xl font-black leading-tight">
                Choose Your Role
              </h1>

              <p className="opacity-70 mt-3 text-sm md:text-base max-w-lg mx-auto">
                This helps us customize your dashboard, tools and learning
                experience.
              </p>
            </div>

            {/* ROLE CARDS */}

            <div className="grid md:grid-cols-2 gap-6">
              {/* JAMB */}

              <button
                onClick={() => setSelected("jamb")}
                className={`relative overflow-hidden rounded-3xl p-6 text-left transition-all duration-300 hover:scale-[1.02] ${card} ${
                  selected === "jamb" ? selectedCard : ""
                }`}
              >
                {/* ACTIVE BADGE */}

                {selected === "jamb" && (
                  <div className="absolute top-5 right-5">
                    <CheckCircle2 className="text-indigo-500" size={24} />
                  </div>
                )}

                {/* ICON */}

                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-green-500/20">
                  <Target size={30} />
                </div>

                {/* CONTENT */}

                <div className="mt-6">
                  <h2 className="text-2xl font-black">JAMB Candidate</h2>

                  <p className="opacity-70 text-sm mt-3 leading-relaxed">
                    Practice CBT exams, access past questions, use AI tutoring
                    and prepare for admission success.
                  </p>
                </div>

                {/* FEATURES */}

                <div className="mt-6 space-y-3">
                  {[
                    "CBT Practice",
                    "Past Questions",
                    "AI Tutor",
                    "Exam Analytics",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 size={16} className="text-green-500" />

                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </button>

              {/* UNIVERSITY */}

              <button
                onClick={() => setSelected("university")}
                className={`relative overflow-hidden rounded-3xl p-6 text-left transition-all duration-300 hover:scale-[1.02] ${card} ${
                  selected === "university" ? selectedCard : ""
                }`}
              >
                {/* ACTIVE BADGE */}

                {selected === "university" && (
                  <div className="absolute top-5 right-5">
                    <CheckCircle2 className="text-indigo-500" size={24} />
                  </div>
                )}

                {/* ICON */}

                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                  <GraduationCap size={30} />
                </div>

                {/* CONTENT */}

                <div className="mt-6">
                  <h2 className="text-2xl font-black">University Student</h2>

                  <p className="opacity-70 text-sm mt-3 leading-relaxed">
                    Manage GPA, access notes, tutorials, hostel listings and
                    connect with other students.
                  </p>
                </div>

                {/* FEATURES */}

                <div className="mt-6 space-y-3">
                  {[
                    "CGPA Calculator",
                    "Lecture Notes",
                    "Tutorials",
                    "Student Marketplace",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 size={16} className="text-indigo-500" />

                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </button>
            </div>

            {/* CONTINUE BUTTON */}

            <div className="mt-10">
              <button
                onClick={handleContinue}
                disabled={!selected || loading}
                className={`w-full h-14 rounded-2xl font-bold text-white transition-all duration-300 flex items-center justify-center gap-2 ${
                  !selected || loading
                    ? "bg-indigo-400 cursor-not-allowed"
                    : "bg-indigo-500 hover:bg-indigo-600 hover:scale-[1.01]"
                }`}
              >
                {loading ? (
                  "Saving Preference..."
                ) : (
                  <>
                    Continue
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </div>

            {/* NOTE */}

            <div className="mt-6 flex items-center justify-center gap-2 text-sm opacity-70 text-center">
              <BookOpen size={16} />

              <span>You can change your role later in settings anytime.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectRole;
