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
} from "lucide-react";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";

const About = ({ dark }) => {
    const navigate = useNavigate();
  const features = [
    {
      icon: <GraduationCap size={28} />,
      title: "Academic Tools",
      description:
        "Powerful GPA & CGPA calculators, lecture notes, past questions, and productivity tools to help students excel.",
    },
    {
      icon: <Brain size={28} />,
      title: "AI Assistance",
      description:
        "Smart AI-powered learning support designed to help students understand concepts faster.",
    },
    {
      icon: <BookOpen size={28} />,
      title: "Learning Hub",
      description:
        "Access educational videos and student-created learning resources.",
    },
    {
      icon: <ShoppingBag size={28} />,
      title: "Student Marketplace",
      description:
        "Buy, sell, and discover products and services within your campus community.",
    },
    {
      icon: <Home size={28} />,
      title: "Hostel Finder",
      description:
        "Find verified hostels and accommodation opportunities around your institution.",
    },
    {
      icon: <Users size={28} />,
      title: "Community",
      description:
        "Connect with fellow students, share ideas, collaborate, and stay informed.",
    },
  ];

  return (
    <>
    <div
      className={`min-h-screen py-12 px-4 md:px-8 ${
        dark
          ? "bg-slate-950 text-white"
          : "bg-slate-50 text-slate-900"
      }`}
    >
      <div className="max-w-7xl mx-auto">
        <span onClick={()=> navigate(-1)} className="flex cursor-pointer items-center gap-1 font-medium text-2xl"> <ArrowLeft size={22}/> Back</span>
        {/* HERO */}
        <div className="text-center mb-20">
          <div className="flex justify-center mb-6">
            <div className="bg-indigo-600 p-5 rounded-3xl">
              <Rocket size={40} className="text-white" />
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            About UniHelp
          </h1>

          <p
            className={`max-w-3xl mx-auto text-lg md:text-xl ${
              dark ? "text-zinc-400" : "text-slate-600"
            }`}
          >
            UniHelp is an all-in-one student platform built to solve
            everyday campus challenges through technology, learning,
            collaboration, and innovation.
          </p>
        </div>

        {/* MISSION */}
        <div
          className={`rounded-3xl p-8 md:p-12 mb-20 ${
            dark
              ? "bg-white/5 border border-white/10"
              : "bg-white border border-slate-200"
          }`}
        >
          <h2 className="text-3xl font-bold mb-6">
            Our Mission
          </h2>

          <p
            className={`leading-8 text-lg ${
              dark ? "text-zinc-400" : "text-slate-600"
            }`}
          >
            Our mission is to create a digital ecosystem where students
            can learn, collaborate, access resources, find opportunities,
            and solve academic challenges without switching between
            multiple platforms.
          </p>
        </div>

        {/* FEATURES */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">
            What UniHelp Offers
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 ${
                  dark
                    ? "bg-white/5 border border-white/10"
                    : "bg-white border border-slate-200"
                }`}
              >
                <div className="text-indigo-500 mb-4">
                  {feature.icon}
                </div>

                <h3 className="text-xl font-semibold mb-3">
                  {feature.title}
                </h3>

                <p
                  className={`${
                    dark
                      ? "text-zinc-400"
                      : "text-slate-600"
                  }`}
                >
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* VISION */}
        <div
          className={`rounded-3xl p-8 md:p-12 mb-20 ${
            dark
              ? "bg-white/5 border border-white/10"
              : "bg-white border border-slate-200"
          }`}
        >
          <h2 className="text-3xl font-bold mb-6">
            Our Vision
          </h2>

          <p
            className={`leading-8 text-lg ${
              dark ? "text-zinc-400" : "text-slate-600"
            }`}
          >
            To become Africa's leading student-focused digital platform,
            empowering millions of students with the tools, resources,
            and opportunities needed for academic and personal success.
          </p>
        </div>

        {/* WHY UNIHELP */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Students Love UniHelp
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div
              className={`rounded-3xl p-6 ${
                dark
                  ? "bg-white/5 border border-white/10"
                  : "bg-white border border-slate-200"
              }`}
            >
              <ShieldCheck
                size={35}
                className="text-green-500 mb-4"
              />
              <h3 className="font-semibold text-xl mb-3">
                Trusted Platform
              </h3>
              <p
                className={
                  dark
                    ? "text-zinc-400"
                    : "text-slate-600"
                }
              >
                Built with security, reliability, and student needs in
                mind.
              </p>
            </div>

            <div
              className={`rounded-3xl p-6 ${
                dark
                  ? "bg-white/5 border border-white/10"
                  : "bg-white border border-slate-200"
              }`}
            >
              <Video
                size={35}
                className="text-red-500 mb-4"
              />
              <h3 className="font-semibold text-xl mb-3">
                Rich Learning Resources
              </h3>
              <p
                className={
                  dark
                    ? "text-zinc-400"
                    : "text-slate-600"
                }
              >
                Access educational videos, notes, and learning resources
                content from fellow students.
              </p>
            </div>

            <div
              className={`rounded-3xl p-6 ${
                dark
                  ? "bg-white/5 border border-white/10"
                  : "bg-white border border-slate-200"
              }`}
            >
              <Heart
                size={35}
                className="text-pink-500 mb-4"
              />
              <h3 className="font-semibold text-xl mb-3">
                Student-Centered
              </h3>
              <p
                className={
                  dark
                    ? "text-zinc-400"
                    : "text-slate-600"
                }
              >
                Every feature is designed to solve real problems faced
                by students daily.
              </p>
            </div>
          </div>
        </div>

        {/* FOUNDER MESSAGE */}
        <div
          className={`rounded-3xl p-8 md:p-12 ${
            dark
              ? "bg-indigo-950/40 border border-indigo-800"
              : "bg-indigo-50 border border-indigo-200"
          }`}
        >
          <h2 className="text-3xl font-bold mb-6">
            A Message From The Founder
          </h2>

          <p
            className={`leading-8 text-lg ${
              dark ? "text-zinc-300" : "text-slate-700"
            }`}
          >
            UniHelp was created with one goal: making student life
            easier. From academic resources to hostel search,
            marketplace services, AI assistance, and community
            engagement, UniHelp aims to become the digital home for
            students everywhere.
          </p>
        </div>
      </div>
      
    </div>
    <Footer/>
    </>
    
  );
};

export default About;