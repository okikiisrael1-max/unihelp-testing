import React from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Rocket,
  Clock,
  Bell,
  Zap,
  Shield,
  Brain,
  TrendingUp,
  Users,
} from "lucide-react";

const ComingSoon = ({ dark }) => {
  const features = [
    {
      title: "AI Study Planner",
      desc: "Automatically builds your weekly study schedule",
      icon: Brain,
      status: "In Development",
    },
    {
      title: "Smart Exam Predictor",
      desc: "Predict likely exam topics using AI",
      icon: TrendingUp,
      status: "Coming Soon",
    },
    {
      title: "Study Group Matcher",
      desc: "Connect with students in your course",
      icon: Users,
      status: "Coming Soon",
    },
    {
      title: "Flashcards Generator",
      desc: "Turn notes into smart flashcards instantly",
      icon: Zap,
      status: "In Development",
    },
    {
      title: "Scholarship Finder",
      desc: "Find verified scholarships easily",
      icon: Shield,
      status: "Coming Soon",
    },
    {
      title: "Smart Timetable Builder",
      desc: "Auto-generate perfect school timetable",
      icon: Clock,
      status: "Available",
      to: "/smart-timetable",
    },
  ];

  const bg = dark
    ? "bg-[#050816] text-white"
    : "bg-[#f5f7ff] text-gray-900";

  const card = dark
    ? "bg-white/[0.03] border border-white/10"
    : "bg-white border border-gray-200 shadow-sm";

  return (
    <div className={`min-h-screen px-4 md:pt-20 md:px-10 py-16 ${bg}`}>
      {/* HERO SECTION */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="flex justify-center mb-4">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
            <Rocket size={32} />
          </div>
        </div>

        <h1 className="text-3xl md:text-5xl font-black mb-3">
          Big Things Are Coming
        </h1>

        <p className="opacity-70 text-sm md:text-base">
          We are building powerful AI tools, academic features,
          and campus innovations to make your student life
          smarter, easier, and faster.
        </p>
      </div>

      {/* HYPE BANNER */}
      <div className="max-w-4xl mx-auto mb-12">
        <div className="rounded-3xl p-6 md:p-10 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white text-center relative overflow-hidden">

          <div className="absolute inset-0 opacity-20">
            <Sparkles size={200} className="absolute -top-10 -left-10" />
          </div>

          <h2 className="text-2xl md:text-4xl font-black mb-3">
            UniHelp is evolving into a Super App
          </h2>

          <p className="text-white/80">
            AI-powered learning, student marketplace, productivity tools,
            and campus networking - all in one place.
          </p>
        </div>
      </div>

      {/* FEATURES GRID */}
      <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((item, index) => {
          const Icon = item.icon;

          return (
            <Link
              key={index}
              to={item.to || "#"}
              className={`${card} rounded-3xl p-6 hover:scale-[1.03] transition`}
            >
              <div className="flex items-center justify-between mb-4">

                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                  <Icon className="text-indigo-500" />
                </div>

                <span className={`text-xs px-3 py-1 rounded-full font-semibold ${item.to ? "bg-emerald-500/20 text-emerald-500" : "bg-yellow-500/20 text-yellow-500"}`}>
                  {item.status}
                </span>
              </div>

              <h2 className="font-bold text-lg mb-1">
                {item.title}
              </h2>

              <p className="text-sm opacity-70">
                {item.desc}
              </p>
            </Link>
          );
        })}
      </div>

      {/* NOTIFY ME SECTION */}
      <div className="max-w-xl mx-auto text-center mt-16">
        <div className="flex justify-center mb-4">
          <Bell className="text-indigo-500" size={28} />
        </div>

        <h2 className="text-2xl font-black mb-2">
          Get Notified First
        </h2>

        <p className="text-sm opacity-70 mb-6">
          Be the first to try new UniHelp features before anyone else.
        </p>

        <div className="flex gap-2 justify-center">
          <input
            placeholder="Enter email..."
            className={`px-4 py-3 rounded-2xl w-64 outline-none ${
              dark
                ? "bg-white/10 border border-white/10"
                : "bg-white border border-gray-300"
            }`}
          />

          <button className="px-5 py-3 rounded-2xl bg-indigo-600 text-white font-bold hover:scale-105 transition">
            Notify Me
          </button>
        </div>
      </div>

      {/* FOOTER MESSAGE */}
      <div className="text-center mt-16 opacity-60 text-sm">
        Built for students - UniHelp
      </div>
    </div>
  );
};

export default ComingSoon;
