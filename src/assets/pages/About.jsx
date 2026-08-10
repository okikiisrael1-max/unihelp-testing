import React from "react";
import {
  GraduationCap,
  Brain,
  BookOpen,
  Users,
  Home,
  ShoppingBag,
  Video,
  Rocket,
  ShieldCheck,
  Heart,
  ArrowLeft,
  Sparkles,
  Quote,
} from "lucide-react";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";

const FEATURES = [
  {
    icon: GraduationCap,
    title: "Academic Tools",
    description:
      "Powerful GPA & CGPA calculators, lecture notes, past questions, and productivity tools to help students excel.",
  },
  {
    icon: Brain,
    title: "AI Assistance",
    description:
      "Smart AI-powered learning support designed to help students understand complex concepts faster.",
  },
  {
    icon: BookOpen,
    title: "Learning Hub",
    description:
      "Access educational videos, peer-contributed study materials, and collaborative student resources.",
  },
  {
    icon: ShoppingBag,
    title: "Student Marketplace",
    description:
      "Safely buy, sell, and discover products and services within your campus community.",
  },
  {
    icon: Home,
    title: "Hostel Finder",
    description:
      "Locate and secure verified hostels and accommodation options tailored to your budget.",
  },
  {
    icon: Users,
    title: "Community Network",
    description:
      "Connect with fellow students across campuses, share ideas, collaborate, and stay updated.",
  },
];

const VALUES = [
  {
    icon: ShieldCheck,
    iconColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    title: "Trusted Platform",
    description:
      "Engineered with high security, data privacy, and student accessibility at its core.",
  },
  {
    icon: Video,
    iconColor: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    title: "Rich Learning Resources",
    description:
      "Explore high-quality educational videos, past questions, and peer-contributed study guides.",
  },
  {
    icon: Heart,
    iconColor: "text-pink-500 bg-pink-500/10 border-pink-500/20",
    title: "Student-Centered",
    description:
      "Every tool and feature is crafted to directly solve genuine challenges faced on campus daily.",
  },
];

export default function About({ dark }) {
  const navigate = useNavigate();

  /* Dynamic Dynamic Styling Tokens */
  const pageBg = dark ? "bg-[#050816] text-slate-100" : "bg-[#f8fafc] text-slate-900";
  const glassCard = dark
    ? "bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-xl hover:border-slate-700/80"
    : "bg-white/80 border border-slate-200/80 backdrop-blur-xl shadow-sm hover:border-slate-300";
  const textMuted = dark ? "text-slate-400" : "text-slate-600";
  const innerCard = dark ? "bg-white/5 border border-white/5" : "bg-slate-100/70 border border-slate-200/50";

  return (
    <>
      <div className={`min-h-screen md:mt-15 py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden ${pageBg}`}>
        {/* BACKGROUND AMBIENT GLOWS */}
        <div className="fixed -top-40 -left-40 h-[32rem] w-[32rem] rounded-full bg-indigo-600/15 blur-[140px] pointer-events-none" />
        <div className="fixed top-1/2 -right-40 h-[32rem] w-[32rem] rounded-full bg-purple-600/15 blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto space-y-16 relative z-10">
          {/* BACK BUTTON */}
          <div>
            <button
              onClick={() => navigate(-1)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                dark
                  ? "bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-800"
                  : "bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 shadow-sm"
              }`}
            >
              <ArrowLeft size={18} />
              <span>Back</span>
            </button>
          </div>

          {/* HERO SECTION */}
          <div className="text-center max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center justify-center p-4 rounded-3xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-xl shadow-indigo-500/20">
              <Rocket size={38} />
            </div>

            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Sparkles size={14} />
                Empowering Student Success
              </div>
              <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
                About <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">UniHelp</span>
              </h1>
              <p className={`text-lg sm:text-xl leading-relaxed ${textMuted} max-w-2xl mx-auto`}>
                UniHelp is an all-in-one student platform built to simplify everyday campus challenges through modern technology, learning resources, and community collaboration.
              </p>
            </div>
          </div>

          {/* MISSION SECTION */}
          <div className={`${glassCard} rounded-3xl p-8 sm:p-12 relative overflow-hidden transition-all duration-300`}>
            <div className="max-w-3xl space-y-4">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
                Our Mission
              </h2>
              <p className={`text-base sm:text-lg leading-relaxed ${textMuted}`}>
                To engineer an interconnected digital ecosystem where students can learn, collaborate, access essential campus resources, unlock opportunities, and overcome academic hurdles without having to switch between disconnected platforms.
              </p>
            </div>
          </div>

          {/* FEATURES GRID */}
          <div className="space-y-10">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black tracking-tight">What UniHelp Offers</h2>
              <p className={`text-sm sm:text-base ${textMuted}`}>Designed from the ground up for modern academic lifestyles.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className={`${glassCard} rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 group flex flex-col justify-between space-y-4`}
                  >
                    <div className="space-y-4">
                      <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                        <Icon size={24} />
                      </div>
                      <h3 className="text-xl font-bold tracking-tight">{feature.title}</h3>
                      <p className={`text-sm leading-relaxed ${textMuted}`}>{feature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* VISION SECTION */}
          <div className={`${glassCard} rounded-3xl p-8 sm:p-12 relative overflow-hidden transition-all duration-300`}>
            <div className="max-w-3xl space-y-4">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Our Vision</h2>
              <p className={`text-base sm:text-lg leading-relaxed ${textMuted}`}>
                To become Africa's leading student-focused digital infrastructure, empowering millions of tertiary students with the tools, resources, and networking opportunities required to achieve academic and personal growth.
              </p>
            </div>
          </div>

          {/* WHY UNIHELP */}
          <div className="space-y-10">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black tracking-tight">Why Students Love UniHelp</h2>
              <p className={`text-sm sm:text-base ${textMuted}`}>Built with passion, trust, and real campus insights.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {VALUES.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={index} className={`${glassCard} rounded-3xl p-6 space-y-4 transition-all duration-300`}>
                    <div className={`h-12 w-12 rounded-2xl border flex items-center justify-center ${item.iconColor}`}>
                      <Icon size={24} />
                    </div>
                    <h3 className="text-xl font-bold tracking-tight">{item.title}</h3>
                    <p className={`text-sm leading-relaxed ${textMuted}`}>{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* FOUNDER MESSAGE */}
          <div
            className={`rounded-3xl p-8 sm:p-12 relative overflow-hidden border ${
              dark
                ? "bg-gradient-to-br from-indigo-950/50 via-slate-900/80 to-purple-950/40 border-indigo-800/50"
                : "bg-gradient-to-br from-indigo-50 via-white to-purple-50 border-indigo-200"
            }`}
          >
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-3 text-indigo-500">
                <Quote size={28} />
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                  A Message From The Founder
                </h2>
              </div>
              <p className={`text-base sm:text-lg leading-relaxed ${dark ? "text-slate-300" : "text-slate-700"}`}>
                UniHelp was born out of a simple mission: making student life easier and more productive. From academic calculators to hostel search engines, marketplace tools, AI assistance, and social community spaces, UniHelp is designed to be your ultimate digital campus companion.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}